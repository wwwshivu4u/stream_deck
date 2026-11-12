"""Alias pointing to audio_manager for seamless compatibility."""
from audio_manager import (
    get_audio_state,
    get_state,
    set_master_volume,
    set_master_mute,
    set_app_volume,
    set_app_mute,
)

__all__ = [
    "get_audio_state",
    "get_state",
    "set_master_volume",
    "set_master_mute",
    "set_app_volume",
    "set_app_mute",
]
