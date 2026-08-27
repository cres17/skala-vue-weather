from server.app import search_locations
from server.vercel_handler import BaseApiHandler


class handler(BaseApiHandler):
    def do_GET(self):
        try:
            self.send_json(200, search_locations(self.query_params()["q"][0]))
        except (KeyError, ValueError) as error:
            self.send_bad_request(error)
        except Exception:
            self.send_json(500, {"message": "도시 검색 정보를 불러오지 못했습니다."})
