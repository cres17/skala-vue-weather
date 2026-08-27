import json

from server.app import get_weather, get_weather_batch
from server.vercel_handler import BaseApiHandler


class handler(BaseApiHandler):
    def do_GET(self):
        try:
            params = self.query_params()
            self.send_json(200, get_weather(float(params["lat"][0]), float(params["lon"][0])))
        except (KeyError, ValueError) as error:
            self.send_bad_request(error)
        except Exception:
            self.send_json(500, {"message": "날씨 정보를 불러오지 못했습니다."})

    def do_POST(self):
        try:
            self.send_json(200, get_weather_batch(self.read_json_body().get("cities")))
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
            self.send_bad_request(error)
        except Exception:
            self.send_json(500, {"message": "도시 날씨를 불러오지 못했습니다."})
