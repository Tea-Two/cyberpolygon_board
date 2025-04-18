from flask_restx import Namespace, Resource
from CTFd.cache import clear_scoreboard_list

clearcache_namespace = Namespace(
    "clearcache", description="Endpoint to clear cache"
)

@clearcache_namespace.route("")
class ClearCache(Resource):
    def get(self):
        clear_scoreboard_list()
        return {"success": True}