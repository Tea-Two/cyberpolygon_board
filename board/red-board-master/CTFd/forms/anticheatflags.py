from wtforms import SelectField, StringField
from wtforms.validators import InputRequired

from CTFd.forms import BaseForm
from CTFd.forms.fields import SubmitField


class AnticheatFlagsSearchForm(BaseForm):
    field = SelectField(
        "Search Field",
        choices=[
            ("content", "Flag"),
            ("id", "ID"),
            ("user_id", "Participant"),
            ("name", "Task"),
        ],
        default="task",
        validators=[InputRequired()],
    )
    q = StringField("Parameter", validators=[InputRequired()])
    submit = SubmitField("Search")