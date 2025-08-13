# config_state.py
class ConfigState:
    def __init__(self):
        self.suppression_seconds = 600
        self.delay = 0.5
        self.conf_threshold = 0.4
        self.save_route = 'None'
        self.save_classes = {"person", "vehicle", "bird", "mammal"}

config_state = ConfigState()
