"""Small Vercel adapters that reuse the local API's provider logic."""

import json
import urllib.parse

from server.app import ApiHandler


class BaseApiHandler(ApiHandler):
    def query_params(self):
        return urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)

    def send_bad_request(self, error):
        self.send_json(400, {"message": str(error)})

    def read_json_body(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length > 100_000:
            raise ValueError("요청 데이터가 너무 큽니다.")
        return json.loads(self.rfile.read(content_length).decode("utf-8"))
