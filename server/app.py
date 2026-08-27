import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
VENDOR = Path(__file__).resolve().parent / "vendor"
if VENDOR.exists():
    sys.path.insert(0, str(VENDOR))

try:
    from utci import rh_to_vp, utci_approx
    UTCI_IMPORT_ERROR = ""
except ImportError as error:
    # Keep weather and air-quality endpoints available when a local Python
    # environment has not installed the optional UTCI calculation package yet.
    # The UI can then show a useful unavailable state instead of the whole API
    # server failing at import time.
    rh_to_vp = None
    utci_approx = None
    UTCI_IMPORT_ERROR = str(error)


KMA_STATIONS = {
    "seoul": 108,
    "suwon": 119,
    "busan": 159,
    "jeju": 184,
    "daejeon": 133,
    "gwangju": 156,
}

KST = timezone(timedelta(hours=9))
UTCI_MAX_OBSERVATION_AGE = timedelta(hours=1)
KMA_MID_REGION_URL = "https://apihub.kma.go.kr/api/typ01/url/fct_medm_reg.php"
KMA_MID_LAND_FORECAST_URL = "https://apihub.kma.go.kr/api/typ01/url/fct_afs_wl.php"
KMA_MID_TEMPERATURE_FORECAST_URL = "https://apihub.kma.go.kr/api/typ01/url/fct_afs_wc.php"
AIR_KOREA_REALTIME_URL = "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty"
KMA_MID_REGIONS = [
    (37.57, 127.00, "11B00000"),  # 서울·인천·경기
    (37.80, 127.80, "11D10000"),  # 강원 영서
    (37.75, 128.85, "11D20000"),  # 강원 영동
    (36.80, 127.75, "11C10000"),  # 충북
    (36.45, 126.95, "11C20000"),  # 대전·세종·충남
    (35.80, 127.10, "11F10000"),  # 전북
    (34.90, 126.85, "11F20000"),  # 광주·전남
    (36.30, 128.60, "11H10000"),  # 대구·경북
    (35.30, 128.55, "11H20000"),  # 부산·울산·경남
    (33.40, 126.55, "11G00000"),  # 제주
]
KMA_MID_TEMPERATURE_REGIONS = [
    (37.57, 126.98, "11B10101"),  # 서울
    (37.46, 126.71, "11B20201"),  # 인천
    (37.30, 127.01, "11B20601"),  # 수원·경기 남부
    (37.88, 127.73, "11D10301"),  # 춘천·강원 영서
    (37.75, 128.88, "11D20501"),  # 강릉·강원 영동
    (36.58, 127.51, "11C10301"),  # 청주·충북
    (36.35, 127.38, "11C20401"),  # 대전·세종·충남
    (35.81, 127.12, "11F10201"),  # 전주·전북
    (35.16, 126.85, "11F20501"),  # 광주·전남
    (35.87, 128.60, "11H10701"),  # 대구·경북
    (35.55, 129.31, "11H20101"),  # 울산
    (35.18, 129.08, "11H20201"),  # 부산·경남
    (33.50, 126.53, "11G00201"),  # 제주
]
KMA_STATION_POINTS = [
    (37.57, 126.98, 108), (37.46, 126.71, 112), (37.30, 127.01, 119),
    (37.88, 127.73, 101), (37.75, 128.88, 105), (36.58, 127.51, 131),
    (36.35, 127.38, 133), (35.81, 127.12, 146), (35.16, 126.85, 156),
    (35.87, 128.60, 143), (35.55, 129.31, 152), (35.18, 129.08, 159),
    (33.50, 126.53, 184),
]
AIR_KOREA_STATIONS = [
    (37.57, 126.98, "중구"), (37.46, 126.71, "부평"), (37.30, 127.01, "수원"),
    (37.88, 127.73, "석사동"), (37.75, 128.88, "옥천동"), (36.58, 127.51, "복대동"),
    (36.35, 127.38, "구성동"), (35.81, 127.12, "노송동"), (35.16, 126.85, "서석동"),
    (35.87, 128.60, "수창동"), (35.55, 129.31, "신정동"), (35.18, 129.08, "연산동"),
    (33.50, 126.53, "연동"),
]
KOREAN_LOCATION_CATALOG = [
    {"name": "서울", "lat": 37.5665, "lon": 126.978},
    {"name": "부산", "lat": 35.1796, "lon": 129.0756},
    {"name": "인천", "lat": 37.4563, "lon": 126.7052},
    {"name": "대구", "lat": 35.8714, "lon": 128.6014},
    {"name": "대전", "lat": 36.3504, "lon": 127.3845},
    {"name": "광주", "lat": 35.1595, "lon": 126.8526},
    {"name": "수원", "lat": 37.2636, "lon": 127.0286},
    {"name": "울산", "lat": 35.5384, "lon": 129.3114},
    {"name": "용인", "lat": 37.2411, "lon": 127.1776},
]
KMA_MID_REGION_CODES = None


def load_env_file():
    env_file = ROOT / ".env"
    if not env_file.exists():
        return

    for line in env_file.read_text(encoding="utf-8").splitlines():
        if not line or line.lstrip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key:
            os.environ.setdefault(key, value)


def required_env(name):
    value = os.getenv(name)
    if not value:
        raise ValueError(f"{name} 환경변수가 설정되지 않았습니다.")
    return value


def request_json(url, params, timeout=10):
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(f"{url}?{query}", headers={"User-Agent": "outcast-weather/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="ignore")
        try:
            message = json.loads(body).get("message")
        except json.JSONDecodeError:
            message = None
        raise ValueError(message or f"외부 API 요청에 실패했습니다. ({error.code})") from error
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise ValueError("외부 날씨 API에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.") from error


def request_kma_station(station_id):
    params = {
        "stn": station_id,
        "help": 0,
        "authKey": required_env("KMA_API_KEY"),
    }
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"https://apihub.kma.go.kr/api/typ01/url/kma_sfctm2.php?{query}",
        headers={"User-Agent": "outcast-weather/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            text = response.read().decode("euc-kr", errors="replace")
    except urllib.error.HTTPError as error:
        raise ValueError(f"기상청 관측 정보를 불러오지 못했습니다. ({error.code})") from error

    records = [line.split() for line in text.splitlines() if line[:1].isdigit()]
    if not records:
        raise ValueError("기상청 관측값이 없습니다.")

    fields = records[-1]
    if len(fields) < 35:
        raise ValueError("기상청 관측값 형식이 예상과 다릅니다.")

    def number(index):
        value = float(fields[index])
        return None if value <= -9 else value

    return {
        "observedAt": fields[0],
        "temperature": number(11),
        "humidity": number(13),
        "vapourPressure": number(14),
        "windSpeed": number(3),
        "rainfall": number(15),
        "solarRadiation": number(34),
    }


def request_kma_text(url, params):
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(f"{url}?{query}", headers={"User-Agent": "outcast-weather/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.read().decode("euc-kr", errors="replace")
    except urllib.error.HTTPError as error:
        raise ValueError(f"기상청 예보 정보를 불러오지 못했습니다. ({error.code})") from error


def get_nearest_air_korea_station(latitude, longitude):
    return min(
        AIR_KOREA_STATIONS,
        key=lambda station: (latitude - station[0]) ** 2 + (longitude - station[1]) ** 2,
    )[2]


def air_quality_grade(value):
    try:
        grade = int(value)
    except (TypeError, ValueError):
        return None
    return grade if 1 <= grade <= 4 else None


def air_quality_number(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number >= 0 else None


def particulate_grade(pm10, pm25):
    grades = []
    if pm10 is not None:
        grades.append(1 if pm10 <= 30 else 2 if pm10 <= 80 else 3 if pm10 <= 150 else 4)
    if pm25 is not None:
        grades.append(1 if pm25 <= 15 else 2 if pm25 <= 35 else 3 if pm25 <= 75 else 4)
    return max(grades) if grades else None


def build_air_index(latitude, longitude):
    api_key = os.getenv("AIR_KOREA_API_KEY")
    if not api_key:
        return {
            "available": False,
            "message": "대기질 인증키가 설정되지 않았습니다. AIR_KOREA_API_KEY를 등록해 주세요.",
        }

    station_name = get_nearest_air_korea_station(latitude, longitude)
    try:
        payload = request_json(
            AIR_KOREA_REALTIME_URL,
            {
                "serviceKey": api_key,
                "returnType": "json",
                "numOfRows": 1,
                "pageNo": 1,
                "stationName": station_name,
                "dataTerm": "DAILY",
                "ver": "1.4",
            },
            timeout=15,
        )
    except ValueError as error:
        return {"available": False, "message": f"대기질 정보를 불러오지 못했습니다. ({error})"}

    items = payload.get("response", {}).get("body", {}).get("items", [])
    if not items:
        return {"available": False, "message": "해당 측정소의 대기질 관측값이 없습니다."}

    item = items[0]
    pm10 = air_quality_number(item.get("pm10Value"))
    pm25 = air_quality_number(item.get("pm25Value"))
    grades = [
        air_quality_grade(item.get(key))
        for key in ("khaiGrade", "pm10Grade", "pm25Grade", "pm10Grade1h", "pm25Grade1h")
    ]
    grade = max((value for value in grades if value is not None), default=None)
    if grade is None:
        grade = particulate_grade(pm10, pm25)
    if grade is None:
        return {"available": False, "message": "대기질 등급을 확인할 수 없습니다."}

    labels = {1: "좋음", 2: "보통", 3: "나쁨", 4: "매우 나쁨"}
    return {
        "available": True,
        "stationName": station_name,
        "observedAt": item.get("dataTime"),
        "grade": grade,
        "label": labels[grade],
        "pm10": pm10,
        "pm25": pm25,
        "khaiValue": item.get("khaiValue"),
    }


def parse_kma_observed_at(value):
    """Parse KMA's YYYYMMDDHHMM observation timestamp as Korea Standard Time."""
    normalized = str(value).strip().replace("-", "").replace(":", "").replace(" ", "")
    for format_string in ("%Y%m%d%H%M", "%Y%m%d%H"):
        try:
            return datetime.strptime(normalized, format_string).replace(tzinfo=KST)
        except ValueError:
            continue
    raise ValueError("기상청 관측 시각을 확인할 수 없습니다.")


def is_recent_utci_observation(observed_at):
    observed_time = parse_kma_observed_at(observed_at)
    # KMA timestamps have minute precision, so compare at that same precision.
    now = datetime.now(KST).replace(second=0, microsecond=0)
    age = now - observed_time
    # A timestamp up to 10 minutes ahead can occur when the source rounds its update time.
    return timedelta(minutes=-10) <= age <= UTCI_MAX_OBSERVATION_AGE


def estimate_mrt(temperature, solar_radiation):
    if solar_radiation is None:
        return temperature

    # KMA SI is hourly solar energy in MJ/m². Convert it to an approximate W/m²
    # and expose the final UTCI as an estimate because long-wave radiation is absent.
    solar_watts = max(solar_radiation, 0) * 1_000_000 / 3600
    return temperature + min(solar_watts * 0.03, 35)


def get_utci_stress(value):
    if value > 46:
        return "극심한 열 스트레스"
    if value > 38:
        return "매우 강한 열 스트레스"
    if value > 32:
        return "강한 열 스트레스"
    if value > 26:
        return "중간 열 스트레스"
    if value > 9:
        return "열 스트레스 없음"
    if value > 0:
        return "약한 한랭 스트레스"
    if value > -13:
        return "중간 한랭 스트레스"
    return "강한 한랭 스트레스"


def get_nearest_kma_station(latitude, longitude):
    return min(
        KMA_STATION_POINTS,
        key=lambda station: (latitude - station[0]) ** 2 + (longitude - station[1]) ** 2,
    )[2]


def build_thermal_index(city_id, latitude, longitude):
    if utci_approx is None or rh_to_vp is None:
        return {
            "available": False,
            "message": "UTCI 계산 모듈을 준비하지 못했습니다. requirements.txt를 설치한 뒤 다시 확인해 주세요.",
            "technicalMessage": UTCI_IMPORT_ERROR,
        }

    station_id = KMA_STATIONS.get(city_id) or get_nearest_kma_station(latitude, longitude)

    try:
        observation = request_kma_station(station_id)
    except ValueError as error:
        return {"available": False, "message": str(error)}
    if not is_recent_utci_observation(observation["observedAt"]):
        return {
            "available": False,
            "message": "최근 1시간 이내의 기상청 UTCI 관측값이 없습니다.",
            "observedAt": observation["observedAt"],
        }

    required = [observation["temperature"], observation["humidity"], observation["windSpeed"]]
    if any(value is None for value in required):
        return {"available": False, "message": "UTCI 계산에 필요한 기상청 관측값이 부족합니다."}

    mrt = estimate_mrt(observation["temperature"], observation["solarRadiation"])
    wind = min(max(observation["windSpeed"], 0.5), 17)
    vapour_pressure = observation["vapourPressure"] or rh_to_vp(observation["temperature"], observation["humidity"])
    value = float(utci_approx(observation["temperature"], vapour_pressure, mrt, wind))

    return {
        "available": True,
        "value": round(value, 1),
        "stress": get_utci_stress(value),
        "estimated": True,
        "observedAt": observation["observedAt"],
        "stationId": station_id,
        "inputs": {
            "temperature": observation["temperature"],
            "humidity": observation["humidity"],
            "windSpeed": observation["windSpeed"],
            "rainfall": observation["rainfall"],
            "solarRadiation": observation["solarRadiation"],
            "meanRadiantTemperature": round(mrt, 1),
        },
    }


def build_outdoor_decision(thermal, air):
    reasons = []

    if thermal.get("available"):
        utci = thermal["value"]
        inputs = thermal["inputs"]
        if utci > 38:
            reasons.append({
                "type": "heat",
                "severity": "danger",
                "title": "바깥이 너무 더워요",
                "detail": f"UTCI {utci}°C로 매우 강한 열 스트레스 구간입니다.",
            })
        elif utci > 32:
            reasons.append({
                "type": "heat",
                "severity": "danger",
                "title": "더위에 주의해 주세요",
                "detail": f"UTCI {utci}°C로 강한 열 스트레스 구간입니다.",
            })
        elif utci <= -13:
            reasons.append({
                "type": "cold",
                "severity": "danger",
                "title": "바깥이 매우 추워요",
                "detail": f"UTCI {utci}°C로 강한 한랭 스트레스 구간입니다.",
            })
        elif utci <= 0:
            reasons.append({
                "type": "cold",
                "severity": "caution",
                "title": "추위에 대비해 주세요",
                "detail": f"UTCI {utci}°C로 한랭 스트레스가 예상됩니다.",
            })

        solar_radiation = inputs.get("solarRadiation")
        if solar_radiation is not None and solar_radiation >= 2:
            reasons.append({
                "type": "radiation",
                "severity": "danger",
                "title": "복사열이 강해요",
                "detail": f"기상청 일사량 {solar_radiation} MJ/m² 기준으로 체감 온도가 크게 올라갈 수 있어요.",
            })

        wind_speed = inputs.get("windSpeed")
        if wind_speed is not None and wind_speed >= 10:
            reasons.append({
                "type": "wind",
                "severity": "caution",
                "title": "바람이 매우 많이 불어요",
                "detail": f"평균 풍속 {wind_speed} m/s입니다. 시설물과 우산 사용에 주의해 주세요.",
            })

        rainfall = inputs.get("rainfall")
        if rainfall is not None and rainfall > 0:
            reasons.append({
                "type": "rain",
                "severity": "caution",
                "title": "비가 내리고 있어요",
                "detail": f"최근 관측 강수량은 {rainfall} mm입니다. 미끄럼과 우산을 확인해 주세요.",
            })

    if air.get("available"):
        if air["grade"] >= 4:
            reasons.append({
                "type": "air",
                "severity": "danger",
                "title": "대기질이 매우 나빠요",
                "detail": f"{air['stationName']} 측정소 기준 {air['label']}입니다. 야외 활동을 미루는 편이 좋아요.",
            })
        elif air["grade"] >= 3:
            reasons.append({
                "type": "air",
                "severity": "caution",
                "title": "대기질이 나빠요",
                "detail": f"{air['stationName']} 측정소 기준 {air['label']}입니다. 마스크를 준비하고 활동 시간을 줄여 주세요.",
            })

    has_thermal = thermal.get("available")
    if not has_thermal:
        if any(reason["severity"] == "danger" for reason in reasons):
            return {
                "available": True,
                "verdict": "avoid",
                "title": "대기질 때문에 외출을 미루는 편이 좋아요",
                "summary": "UTCI는 확인하지 못했지만, 대기질에서 강한 주의 요인이 확인됐습니다.",
                "reasons": reasons,
            }
        if reasons:
            return {
                "available": True,
                "verdict": "caution",
                "title": "대기질을 확인하고 외출해 주세요",
                "summary": "UTCI는 확인하지 못했지만, 대기질에 주의가 필요합니다.",
                "reasons": reasons,
            }
        return {
            "available": False,
            "verdict": "unknown",
            "title": "외출 판단 정보가 부족해요",
            "summary": "기상청 UTCI 관측값을 받지 못해 안전하게 판별할 수 없습니다.",
            "reasons": [],
        }

    if any(reason["severity"] == "danger" for reason in reasons):
        verdict = "avoid"
        title = "지금은 외출을 미루는 편이 좋아요"
        summary = "야외 환경에 강한 주의 요인이 확인됐습니다. 꼭 나가야 한다면 짧게 이동하고 보호 장비를 준비해 주세요."
    elif reasons:
        verdict = "caution"
        title = "준비하면 외출할 수 있어요"
        summary = "주의할 환경 요인이 있어요. 아래 안내를 확인하고 활동 시간을 조절해 주세요."
    else:
        verdict = "good"
        title = "현재는 야외 활동하기 괜찮아요"
        summary = "기상청 UTCI 관측값에서 강한 주의 요인이 확인되지 않았습니다."

    return {
        "available": True,
        "verdict": verdict,
        "title": title,
        "summary": summary,
        "reasons": reasons,
    }


def get_weather(latitude, longitude):
    station_id = get_nearest_kma_station(latitude, longitude)
    observation = request_kma_station(station_id)
    temperature = observation.get("temperature")
    if temperature is None:
        raise ValueError("기상청 관측 기온이 없습니다.")
    rainfall = observation.get("rainfall")
    return {
        "main": {"temp": temperature, "humidity": observation.get("humidity")},
        "wind": {"speed": observation.get("windSpeed")},
        "weather": [{"id": 500 if rainfall and rainfall > 0 else 803, "description": "강수 관측" if rainfall and rainfall > 0 else "기상청 관측"}],
        "source": f"기상청 지상관측 {station_id}",
        "observedAt": observation.get("observedAt"),
    }

def get_nearest_mid_forecast_region(latitude, longitude):
    return min(
        KMA_MID_REGIONS,
        key=lambda region: (latitude - region[0]) ** 2 + (longitude - region[1]) ** 2,
    )[2]


def get_mid_forecast_condition(description):
    if "눈" in description:
        return 600
    if "비" in description or "소나기" in description:
        return 500
    if "뇌" in description:
        return 200
    if "맑" in description:
        return 800
    if "구름" in description or "흐" in description:
        return 803
    return 741


def get_nearest_mid_temperature_region(latitude, longitude):
    return min(
        KMA_MID_TEMPERATURE_REGIONS,
        key=lambda region: (latitude - region[0]) ** 2 + (longitude - region[1]) ** 2,
    )[2]


def get_kma_mid_region_codes():
    global KMA_MID_REGION_CODES
    if KMA_MID_REGION_CODES is not None:
        return KMA_MID_REGION_CODES

    text = request_kma_text(KMA_MID_REGION_URL, {"tmfc": 0, "authKey": required_env("KMA_API_KEY")})
    codes = {line.split()[0] for line in text.splitlines() if line and not line.startswith("#") and line.split()}
    if not codes:
        raise ValueError("기상청 중기 예보구역 정보를 확인하지 못했습니다.")
    KMA_MID_REGION_CODES = codes
    return codes


def parse_kma_csv_records(text):
    return [line.rstrip("=").rstrip(",").split(",") for line in text.splitlines() if line and not line.startswith("#")]


def get_kma_mid_forecast(latitude, longitude):
    region_id = get_nearest_mid_forecast_region(latitude, longitude)
    temperature_region_id = get_nearest_mid_temperature_region(latitude, longitude)
    region_codes = get_kma_mid_region_codes()
    if region_id not in region_codes or temperature_region_id not in region_codes:
        raise ValueError("기상청 중기 예보구역 코드가 유효하지 않습니다.")

    with ThreadPoolExecutor(max_workers=2) as executor:
        land_request = executor.submit(
            request_kma_text,
            KMA_MID_LAND_FORECAST_URL,
            {"reg": region_id, "tmfc": 0, "disp": 1, "authKey": required_env("KMA_API_KEY")},
        )
        temperature_request = executor.submit(
            request_kma_text,
            KMA_MID_TEMPERATURE_FORECAST_URL,
            {"reg": temperature_region_id, "tmfc": 0, "disp": 1, "authKey": required_env("KMA_API_KEY")},
        )
        land_records = parse_kma_csv_records(land_request.result())
        temperature_records = parse_kma_csv_records(temperature_request.result())

    temperatures = {}
    for fields in temperature_records:
        if len(fields) < 12 or len(fields[2]) < 8:
            continue
        try:
            temperatures[fields[2][:8]] = {
                "temperatureMin": float(fields[6]),
                "temperatureMax": float(fields[7]),
                "temperatureMinLow": float(fields[8]),
                "temperatureMinHigh": float(fields[9]),
                "temperatureMaxLow": float(fields[10]),
                "temperatureMaxHigh": float(fields[11]),
            }
        except ValueError:
            continue

    days_by_date = {}
    for fields in land_records:
        if len(fields) < 11 or len(fields[2]) < 8:
            continue
        date, time = fields[2][:8], fields[2][8:]
        description = fields[9].strip() or "날씨 정보 없음"
        try:
            precipitation_probability = float(fields[10])
        except ValueError:
            precipitation_probability = None
        period = "하루" if fields[3] == "A01" else "오전" if time == "0000" else "오후"
        day = days_by_date.setdefault(date, {"periods": [], "probabilities": []})
        day["periods"].append({"period": period, "description": description, "precipitationProbability": precipitation_probability})
        if precipitation_probability is not None:
            day["probabilities"].append(precipitation_probability)

    days = []
    for date in sorted(days_by_date):
        day = days_by_date[date]
        periods = day["periods"]
        description = "\n".join(f"{item['period']}: {item['description']}" for item in periods)
        forecast = {
            "date": f"{date[:4]}-{date[4:6]}-{date[6:8]}",
            "conditionId": get_mid_forecast_condition(periods[-1]["description"]),
            "description": description,
            "periods": periods,
            "temperatureMax": None,
            "temperatureMin": None,
            "precipitationProbability": max(day["probabilities"]) if day["probabilities"] else None,
            "precipitationSum": None,
            "windSpeedMax": None,
            "uvIndexMax": None,
        }
        forecast.update(temperatures.get(date, {}))
        days.append(forecast)

    today = datetime.now(KST).date()
    forecast_start = today + timedelta(days=4)
    forecast_end = today + timedelta(days=10)
    days = [
        day for day in days
        if forecast_start <= datetime.strptime(day["date"], "%Y-%m-%d").date() <= forecast_end
    ]

    if not days:
        raise ValueError("기상청 중기예보의 4~10일 자료가 없습니다.")
    return days


def get_weather_forecast(latitude, longitude):
    return {
        "midRange": {
            "source": "기상청 중기 육상·기온예보 · 예보구역 확인 완료",
            "coverage": "예보일 +4일(최대 +5일)부터 +10일까지",
            "days": get_kma_mid_forecast(latitude, longitude),
        },
    }


def get_weather_batch(cities):
    if not isinstance(cities, list) or not cities:
        raise ValueError("도시 목록이 필요합니다.")
    if len(cities) > 300:
        raise ValueError("한 번에 최대 300개 도시까지 불러올 수 있습니다.")

    with ThreadPoolExecutor(max_workers=min(8, len(cities))) as executor:
        requests = {
            executor.submit(get_weather, float(city["lat"]), float(city["lon"])): str(city["id"])
            for city in cities
        }
        return {city_id: request.result() for request, city_id in requests.items()}


def search_locations(query):
    search_query = query.strip().lower()
    return [
        {
            "name": location["name"],
            "lat": location["lat"],
            "lon": location["lon"],
            "local_names": {"ko": location["name"]},
        }
        for location in KOREAN_LOCATION_CATALOG
        if search_query in location["name"].lower()
    ]


class ApiHandler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        try:
            if parsed.path == "/api/weather":
                self.send_json(200, get_weather(float(params["lat"][0]), float(params["lon"][0])))
                return
            if parsed.path == "/api/geocoding":
                self.send_json(200, search_locations(params["q"][0]))
                return
            if parsed.path == "/api/forecast":
                self.send_json(200, get_weather_forecast(float(params["lat"][0]), float(params["lon"][0])))
                return
            if parsed.path == "/api/outdoor-assessment":
                latitude = float(params["lat"][0])
                longitude = float(params["lon"][0])
                city_id = params.get("cityId", [""])[0]
                try:
                    thermal = build_thermal_index(city_id, latitude, longitude)
                except Exception as error:
                    thermal = {"available": False, "message": f"UTCI 정보가 없습니다. ({error})"}
                air = build_air_index(latitude, longitude)
                self.send_json(200, {"thermal": thermal, "air": air, "decision": build_outdoor_decision(thermal, air)})
                return
            self.send_json(404, {"message": "요청한 API를 찾지 못했습니다."})
        except (KeyError, ValueError) as error:
            self.send_json(400, {"message": str(error)})
        except Exception:
            self.send_json(500, {"message": "지수 정보를 불러오지 못했습니다."})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        try:
            if parsed.path != "/api/weather":
                self.send_json(404, {"message": "요청한 API를 찾지 못했습니다."})
                return
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length > 100_000:
                raise ValueError("요청 데이터가 너무 큽니다.")
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            self.send_json(200, get_weather_batch(payload.get("cities")))
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
            self.send_json(400, {"message": str(error)})
        except Exception:
            self.send_json(500, {"message": "도시 날씨를 불러오지 못했습니다."})

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    load_env_file()
    server = ThreadingHTTPServer(("127.0.0.1", 8787), ApiHandler)
    print("Outdoor API server listening on http://127.0.0.1:8787")
    server.serve_forever()
