from server.app import get_weather_forecast
from server.vercel_handler import BaseApiHandler


class handler(BaseApiHandler):
    def do_GET(self):
        try:
            params = self.query_params()
            self.send_json(200, get_weather_forecast(float(params["lat"][0]), float(params["lon"][0])))
        except (KeyError, ValueError) as error:
            self.send_bad_request(error)
        except Exception:
            self.send_json(500, {"message": "예보 정보를 불러오지 못했습니다."})
