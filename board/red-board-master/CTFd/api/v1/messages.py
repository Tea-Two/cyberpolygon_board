from typing import List

from flask import current_app, request
from flask_restx import Namespace, Resource

from CTFd.api.v1.helpers.request import validate_args
from CTFd.api.v1.helpers.schemas import sqlalchemy_to_pydantic
from CTFd.api.v1.schemas import APIDetailedSuccessResponse, APIListSuccessResponse
from CTFd.constants import RawEnum
from CTFd.models import Messages, db
from CTFd.schemas.messages import MessagesSchema
from CTFd.utils.decorators import admins_only
from CTFd.utils.helpers.models import build_model_filters

messages_namespace = Namespace(
    "messages", description="Endpoint to retrieve Messages"
)

MessagesModel = sqlalchemy_to_pydantic(Messages)


class MessagesDetailedSuccessResponse(APIDetailedSuccessResponse):
    data: MessagesModel


class MessagesListSuccessResponse(APIListSuccessResponse):
    data: List[MessagesModel]


messages_namespace.schema_model(
    "MessagesDetailedSuccessResponse", MessagesDetailedSuccessResponse.apidoc()
)

messages_namespace.schema_model(
    "MessagesListSuccessResponse", MessagesListSuccessResponse.apidoc()
)


@messages_namespace.route("")
class MessagesList(Resource):
    @admins_only
    @messages_namespace.doc(
        description="Endpoint to get message objects in bulk",
        responses={
            200: ("Success", "MessagesListSuccessResponse"),
            400: (
                "An error occured processing the provided or stored data",
                "APISimpleErrorResponse",
            ),
        },
    )
    @validate_args(
        {
            "body": (str, None),
            "q": (str, None),
            "field": (
                RawEnum("MessagesFields", {"body": "body"}),
                None,
            ),
        },
        location="query",
    )
    def get(self, query_args):
        q = query_args.pop("q", None)
        field = str(query_args.pop("field", None))
        filters = build_model_filters(model=Messages, query=q, field=field)

        messages = (
            Messages.query.filter_by(**query_args).filter(*filters).all()
        )
        schema = MessagesSchema(many=True)
        result = schema.dump(messages)
        if result.errors:
            return {"success": False, "errors": result.errors}, 400
        return {"success": True, "data": result.data}

    @admins_only
    @messages_namespace.doc(
        description="Endpoint to create a message object",
        responses={
            200: ("Success", "MessagesDetailedSuccessResponse"),
            400: (
                "An error occured processing the provided or stored data",
                "APISimpleErrorResponse",
            ),
        },
    )
    def post(self):
        req = request.get_json()

        schema = MessagesSchema()
        result = schema.load(req)

        if result.errors:
            return {"success": False, "errors": result.errors}, 400

        db.session.add(result.data)
        db.session.commit()

        response = schema.dump(result.data)

        return {"success": True, "data": response.data}


@messages_namespace.route("/<message_id>")
@messages_namespace.param("message_id", "A Message ID")
class Message(Resource):
    @messages_namespace.doc(
        description="Endpoint to get a specific message object",
        responses={
            200: ("Success", "MessagesDetailedSuccessResponse"),
            400: (
                "An error occured processing the provided or stored data",
                "APISimpleErrorResponse",
            ),
        },
    )
    def get(self, message_id):
        mess = Messages.query.filter_by(id=message_id).first_or_404()
        schema = MessagesSchema()
        response = schema.dump(mess)
        if response.errors:
            return {"success": False, "errors": response.errors}, 400

        return {"success": True, "data": response.data}

    @admins_only
    @messages_namespace.doc(
        description="Endpoint to delete a message object",
        responses={200: ("Success", "APISimpleSuccessResponse")},
    )
    def delete(self, message_id):
        mess = Messages.query.filter_by(id=message_id).first_or_404()
        db.session.delete(mess)
        db.session.commit()
        db.session.close()

        return {"success": True}
