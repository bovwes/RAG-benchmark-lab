import os
import yaml
import questionary
from dotenv import load_dotenv, set_key

DOTENV_PATH = ".env"
CONFIG_PATH = "config.yaml"

VENDOR_PRESETS = [
    ("OpenAI",    "https://api.openai.com/v1"),
    ("Anthropic", "https://api.anthropic.com/v1"),
    ("Mistral",   "https://api.mistral.ai/v1"),
    ("Google",    "https://generativelanguage.googleapis.com/v1beta/openai/"),
    ("Custom",    None),
]

load_dotenv(DOTENV_PATH)


def _load_config() -> dict:
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH) as f:
            return yaml.safe_load(f) or {}
    return {}


def _save_config(data: dict):
    with open(CONFIG_PATH, "w") as f:
        yaml.dump(data, f, default_flow_style=False)


def _prompt_llm_config():
    choices = [name for name, _ in VENDOR_PRESETS]
    selected = questionary.select("Choose a vendor:", choices=choices).ask()
    if selected is None:
        raise SystemExit("Aborted.")

    idx = choices.index(selected)
    name, base_url = VENDOR_PRESETS[idx]

    if base_url is None:
        base_url = questionary.text("Base URL (e.g. https://api.example.com/v1):").ask().strip()

    api_key = questionary.password(f"API key for {name}:").ask() or "none"

    model = questionary.text("Model name:").ask().strip() or ""

    set_key(DOTENV_PATH, "LLM_API_KEY", api_key)

    config = _load_config()
    config.setdefault("llm", {})
    config["llm"]["base_url"] = base_url
    config["llm"]["model"] = model
    _save_config(config)

    print(f"\nAPI key saved to {DOTENV_PATH}. Model and base URL saved to {CONFIG_PATH}.\n")


def _change_base_url():
    config = _load_config()
    current = config.get("llm", {}).get("base_url", "not set")
    print(f"\nCurrent base_url: {current}")

    choices = [name for name, _ in VENDOR_PRESETS]
    selected = questionary.select("Choose a vendor preset (or Custom):", choices=choices).ask()
    if selected is None:
        return

    idx = choices.index(selected)
    _, base_url = VENDOR_PRESETS[idx]
    if base_url is None:
        base_url = questionary.text("Base URL:", default=current).ask()
        if base_url is None:
            return
        base_url = base_url.strip()

    config.setdefault("llm", {})
    config["llm"]["base_url"] = base_url
    _save_config(config)
    print(f"\nbase_url updated to: {base_url}\n")


def _change_api_key():
    load_dotenv(DOTENV_PATH)
    current = os.getenv("LLM_API_KEY", "not set")
    masked = current[:4] + "…" + current[-4:] if len(current) > 8 else ("*" * len(current) if current != "not set" else "not set")
    print(f"\nCurrent API key: {masked}")

    api_key = questionary.password("New API key (leave blank to keep current):").ask()
    if api_key is None:
        return
    if api_key.strip():
        set_key(DOTENV_PATH, "LLM_API_KEY", api_key.strip())
        print("\nAPI key updated.\n")
    else:
        print("Unchanged.\n")


def _change_model():
    config = _load_config()
    current = config.get("llm", {}).get("model", "not set")
    print(f"\nCurrent model: {current}")

    model = questionary.text("New model name:", default=current).ask()
    if model is None:
        return
    model = model.strip()
    if model and model != current:
        config.setdefault("llm", {})
        config["llm"]["model"] = model
        _save_config(config)
        print(f"\nModel updated to: {model}\n")
    else:
        print("Unchanged.\n")


def _prompt_hf_token():
    print("\nA Hugging Face token enables higher rate limits when downloading embedding models.")

    token = questionary.password("HF token (leave blank to skip):").ask()
    if token is None:
        raise SystemExit("Aborted.")

    if token.strip():
        set_key(DOTENV_PATH, "HF_TOKEN", token.strip())
        print(f"HF token saved to {DOTENV_PATH}.\n")
    else:
        print("Skipped.\n")


def _is_configured() -> bool:
    return _load_config().get("configured", False)


def _show_change_menu():
    while True:
        load_dotenv(DOTENV_PATH)
        config = _load_config()
        llm = config.get("llm", {})
        current_model = llm.get("model", "not set")
        current_url = llm.get("base_url", "not set")
        api_key_raw = os.getenv("LLM_API_KEY", "not set")
        if len(api_key_raw) > 8 and api_key_raw != "not set":
            api_key_display = api_key_raw[:4] + "…" + api_key_raw[-4:]
        else:
            api_key_display = api_key_raw
        hf_status = "set" if os.getenv("HF_TOKEN") else "not set"

        options = [
            f"Vendor base url   | {current_url}",
            f"API key           | {api_key_display}",
            f"Model name        | {current_model}",
            f"HF Access token   | {hf_status}",
            "Exit",
        ]
        choice = questionary.select("Setup — what would you like to change?", choices=options).ask()

        if choice is None or choice == "Exit":
            return
        elif choice == options[0]:
            _change_base_url()
        elif choice == options[1]:
            _change_api_key()
        elif choice == options[2]:
            _change_model()
        elif choice == options[3]:
            _prompt_hf_token()


def main():
    if _is_configured():
        _show_change_menu()
    else:
        print("\nPlease set up access to your LLM vendor.\n")
        _prompt_llm_config()
        print("\nProvide a HF token to enable higher rate limits when downloading embedding models.\n")
        _prompt_hf_token()
        config = _load_config()
        config["configured"] = True
        _save_config(config)


if __name__ == "__main__":
    main()
