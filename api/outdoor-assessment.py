from server.app import build_outdoor_decision, build_thermal_index
from server.vercel_handler import BaseApiHandler


class handler(BaseApiHandler):
    def do_GET(self):
        try:
            params = self.query_params()
            latitude = float(params["lat"][0])
            longitude = float(params["lon"][0])
            city_id = params.get("cityId", [""])[0]
            try:
                thermal = build_thermal_index(city_id, latitude, longitude)
            except Exception as error:
                thermal = {"available": False, "message": f"UTCI 정보가 없습니다. ({error})"}
            self.send_json(200, {"thermal": thermal, "decision": build_outdoor_decision(thermal)})
        except (KeyError, ValueError) as error:
            self.send_bad_request(error)
        except Exception:
            self.send_json(500, {"message": "외출 판단 정보를 불러오지 못했습니다."})
