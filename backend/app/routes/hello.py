from flask import Blueprint, jsonify

hello_bp = Blueprint('hello', __name__)

@hello_bp.route('/hello', methods=['GET'])
def hello_world():
    """
    A sample route to demonstrate how to add new endpoints.
    """
    return jsonify({'message': 'Hello, World!', 'status': 'success'})
