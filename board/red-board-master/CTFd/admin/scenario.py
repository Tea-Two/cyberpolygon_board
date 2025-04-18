from flask import render_template, request, url_for, redirect
from CTFd.admin import admin
from CTFd.utils.decorators import admins_only
from CTFd.models import Challenges, db
from datetime import time
from sqlalchemy import inspect

def column_exists(table, column_name):
    inspector = inspect(db.engine)
    columns = inspector.get_columns(table.__tablename__)
    return any(col['name'] == column_name for col in columns)

@admin.route("/admin/scenario")
@admins_only
def listing_scenario():
    challenges = Challenges.query.order_by(Challenges.id.asc()).all()
    return render_template("admin/scenario.html", challenges=challenges)

@admin.route("/admin/scenario/process_scenario", methods=["POST"])
@admins_only
def process_scenario():
    if not column_exists(Challenges, 'open_time'):
        db.session.execute("ALTER TABLE challenges ADD COLUMN open_time TIME NULL;")
        db.session.commit()
    challenges = Challenges.query.order_by(Challenges.id.asc()).all()
    
    for challenge in challenges:
        total_minutes = request.form.get(f'time_{challenge.id}')
        
        try:
            total_minutes = int(total_minutes)
            hours = total_minutes // 60
            minutes = total_minutes % 60
            selected_time = time(hours, minutes)
            
            if selected_time < time(8, 0) or selected_time > time(18, 0):
                return f"Ошибка: время для {challenge.name} вне диапазона 8:00-18:00", 400
            
            challenge.open_time = selected_time
            
        except (ValueError, TypeError, AttributeError) as e:
            return f"Некорректное время для {challenge.name}: {str(e)}", 400
    
    try:
        db.session.commit()
        return redirect(url_for('admin.listing_scenario'))
    except Exception as e:
        db.session.rollback()
        return f"Ошибка при сохранении в базу данных: {str(e)}", 500