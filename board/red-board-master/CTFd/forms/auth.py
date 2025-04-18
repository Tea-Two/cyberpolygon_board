from wtforms import PasswordField, StringField
from wtforms.fields.html5 import EmailField
from wtforms.validators import InputRequired

from CTFd.forms import BaseForm
from CTFd.forms.fields import SubmitField
from CTFd.forms.users import (
    attach_custom_user_fields,
    attach_registration_code_field,
    build_custom_user_fields,
    build_registration_code_field,
)


def RegistrationForm(*args, **kwargs):
    class _RegistrationForm(BaseForm):
        name = StringField("Имя пользователя", validators=[InputRequired()])
        email = EmailField("Почта", validators=[InputRequired()])
        password = PasswordField("Пароль", validators=[InputRequired()])
        affiliation = StringField("Школа", validators=[InputRequired()])
        submit = SubmitField("Отправить")

        @property
        def extra(self):
            return build_custom_user_fields(
                self, include_entries=False, blacklisted_items=()
            ) + build_registration_code_field(self)

    attach_custom_user_fields(_RegistrationForm)
    attach_registration_code_field(_RegistrationForm)

    return _RegistrationForm(*args, **kwargs)


class LoginForm(BaseForm):
    name = StringField("Имя пользователя или почта", validators=[InputRequired()])
    password = PasswordField("Пароль", validators=[InputRequired()])
    submit = SubmitField("Отправить")


class ConfirmForm(BaseForm):
    submit = SubmitField("Resend Confirmation Email")


class ResetPasswordRequestForm(BaseForm):
    email = EmailField("Почта", validators=[InputRequired()])
    submit = SubmitField("Отправить")


class ResetPasswordForm(BaseForm):
    password = PasswordField("Пароль", validators=[InputRequired()])
    submit = SubmitField("Отправить")
