from wtforms import BooleanField, RadioField, StringField, TextAreaField
from wtforms.validators import InputRequired

from CTFd.forms import BaseForm
from CTFd.forms.fields import SubmitField


class NotificationForm(BaseForm):
    title = StringField("Title", description="Notification title")
    content = TextAreaField(
        "Content",
        description="Notification contents. Can consist of HTML and/or Markdown.",
    )
    type = RadioField(
        "Notification Type",
        choices=[("toast", "Toast"), ("alert", "Alert"), ("background", "Background")],
        default="toast",
        description="What type of notification users receive",
        validators=[InputRequired()],
    )
    sound = BooleanField(
        "Play Sound",
        default=True,
        description="Play sound for users when they receive the notification",
    )
    submit = SubmitField("Submit")

class MessageForm(BaseForm):
    body = TextAreaField(
        "Message",
        description="Formated message for notification. Can consist of Markdown (supported by telegram)."
    )
    submit = SubmitField("Submit")