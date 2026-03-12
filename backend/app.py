from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timedelta
from data import ACTIVITIES as default_activities
from engine import recommend

app = Flask(__name__)
CORS(app)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'Users'
    UserID = db.Column(db.Integer, primary_key=True)
    Email = db.Column(db.String(120), unique=True, nullable=False)
    PasswordHash = db.Column(db.String(256), nullable=False)
    DateCreated = db.Column(db.DateTime, default=datetime.utcnow)
    LastLogin = db.Column(db.DateTime, default=datetime.utcnow)
    activities = db.relationship('Activity', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Activity(db.Model):
    __tablename__ = 'Activities'
    ActivityID = db.Column(db.Integer, primary_key=True)
    UserID = db.Column(db.Integer, db.ForeignKey('Users.UserID'), nullable=False)
    Name = db.Column(db.String(100), nullable=False)
    Description = db.Column(db.String(255), nullable=True)
    Duration = db.Column(db.Integer, default=1)
    Physicality = db.Column(db.Integer, default=1)
    Sociability = db.Column(db.Integer, default=1)
    Importance = db.Column(db.Integer, default=3)
    logs = db.relationship('ActivityLog', backref='activity', cascade='all, delete-orphan', lazy=True)

class ActivityLog(db.Model):
    __tablename__ = 'ActivityLogs'
    LogID = db.Column(db.Integer, primary_key=True)
    ActivityID = db.Column(db.Integer, db.ForeignKey('Activities.ActivityID'), nullable=False)
    Timestamp = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if User.query.filter_by(Email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    new_user = User(Email=email, PasswordHash=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()
    
    # Pre-populate with default activities
    for act in default_activities:
        new_act = Activity(
            UserID=new_user.UserID,
            Name=act['name'],
            Description=act['description'],
            Duration=act['duration'],
            Physicality=act['physicality'],
            Sociability=act['sociability'],
            Importance=act['importance']
        )
        db.session.add(new_act)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201

@app.route('/api/signin', methods=['POST'])
def signin():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(Email=email).first()

    if user and check_password_hash(user.PasswordHash, password):
        user.LastLogin = datetime.utcnow()
        db.session.commit()
        return jsonify({"message": "Login successful", "email": user.Email, "userId": user.UserID}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@app.route('/api/activities', methods=['GET', 'POST'])
def handle_activities():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
        
    if request.method == 'GET':
        acts = Activity.query.filter_by(UserID=user_id).all()
        result = []
        for a in acts:
            result.append({
                "id": a.ActivityID, "name": a.Name, "description": a.Description,
                "duration": a.Duration, "physicality": a.Physicality,
                "sociability": a.Sociability, "importance": a.Importance
            })
        return jsonify(result), 200
    
    elif request.method == 'POST':
        data = request.json
        new_act = Activity(
            UserID=user_id,
            Name=data.get('name', 'Custom Activity'),
            Description=data.get('description', 'A custom activity'),
            Duration=data.get('duration', 1),
            Physicality=data.get('physicality', 1),
            Sociability=data.get('sociability', 1),
            Importance=data.get('importance', 3)
        )
        db.session.add(new_act)
        db.session.commit()
        return jsonify({"message": "Activity created", "id": new_act.ActivityID}), 201

@app.route('/api/activities/<int:activity_id>', methods=['PUT', 'DELETE'])
def update_activity(activity_id):
    act = Activity.query.get_or_404(activity_id)
    
    if request.method == 'PUT':
        data = request.json
        if 'name' in data: act.Name = data['name']
        if 'description' in data: act.Description = data['description']
        if 'duration' in data: act.Duration = data['duration']
        if 'physicality' in data: act.Physicality = data['physicality']
        if 'sociability' in data: act.Sociability = data['sociability']
        if 'importance' in data: act.Importance = data['importance']
        db.session.commit()
        return jsonify({"message": "Activity updated successfully"}), 200
        
    elif request.method == 'DELETE':
        db.session.delete(act)
        db.session.commit()
        return jsonify({"message": "Activity deleted successfully"}), 200

@app.route('/api/log', methods=['POST'])
def log_activity():
    data = request.json
    activity_id = data.get('activityId')
    
    if not activity_id:
        return jsonify({"error": "activityId is required"}), 400
    
    new_log = ActivityLog(ActivityID=activity_id)
    db.session.add(new_log)
    db.session.commit()
    return jsonify({"message": "Activity logged successfully"}), 201

@app.route('/api/logs', methods=['GET'])
def get_logs():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
        
    # Get all activities for the user
    user_activities = Activity.query.filter_by(UserID=user_id).all()
    activity_ids = [act.ActivityID for act in user_activities]
    activity_map = {act.ActivityID: act.Name for act in user_activities}
    
    # Get logs for these activities
    logs = ActivityLog.query.filter(ActivityLog.ActivityID.in_(activity_ids)).all()
    
    result = []
    for log in logs:
        # Assuming we want day of week, 0=Monday, 6=Sunday
        day_of_week = log.Timestamp.weekday()
        result.append({
            "logId": log.LogID,
            "activityId": log.ActivityID,
            "activityName": activity_map[log.ActivityID],
            "timestamp": log.Timestamp.isoformat(),
            "dayOfWeek": day_of_week
        })
    return jsonify(result), 200

def map_minutes_to_slots(minutes):
    """Map the frontend 15-120 minutes to 1-5 duration slots used in Python engine"""
    if minutes <= 15:
        return 1
    elif minutes <= 30:
        return 2
    elif minutes <= 60:
        return 3
    elif minutes <= 90:
        return 4
    else:
        return 5

@app.route('/api/recommend', methods=['POST'])
def get_recommendations():
    data = request.json
    
    user_id = data.get('userId')
    
    # 1. Fetch user specific activities
    acts = Activity.query.filter_by(UserID=user_id).all() if user_id else []
    
    # Map them to the list logic expected by engine
    user_activities = [{"id": a.ActivityID, "name": a.Name, "duration": a.Duration, 
                        "physicality": a.Physicality, "sociability": a.Sociability, 
                        "importance": a.Importance} for a in acts]
    
    # Fallback to default if no user or no acts found
    if not user_activities:
        user_activities = default_activities
    
    # 2. Extract inputs (provide defaults if missing)
    time_minutes = data.get('timeAvailable', 30)
    physical_energy = data.get('physicalEnergy', 3)
    social_battery = data.get('socialBattery', 3)
    
    # 3. Map minutes to Python engine slots
    available_time_slots = map_minutes_to_slots(time_minutes)
    
    # 4. Find recently completed activities (last 18 hours) to prevent immediate repetition
    recent_activity_ids = set()
    if user_id:
        time_threshold = datetime.utcnow() - timedelta(hours=18)
        recent_logs = ActivityLog.query.join(Activity).filter(
            Activity.UserID == user_id, 
            ActivityLog.Timestamp >= time_threshold
        ).all()
        recent_activity_ids = {log.ActivityID for log in recent_logs}
    
    # 5. Get recommendations using custom engine, passing in the recent activities to penalize
    results = recommend(user_activities, available_time_slots, physical_energy, social_battery, recent_activity_ids)
    
    # 6. Format results safely for React (handle cases with None values)
    deterministic = results.get("deterministic", [])
    leap = results.get("take_the_leap")
    
    top_recommendation = None
    alternatives = []
    
    if len(deterministic) > 0:
        top_recommendation = deterministic[0]
        
    if len(deterministic) > 1:
        alternatives.append(deterministic[1])
        
    if leap:
        # We usually want 'take the leap' as the 2nd alternative 
        alternatives.append(leap)

    return jsonify({
        "topRecommendation": top_recommendation,
        "alternatives": alternatives
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
