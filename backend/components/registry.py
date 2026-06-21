"""Runtime discovery of RAG pipeline components.

Walks the `retrievers`, `rerankers`, and `generators` subpackages and reports
every component class it finds there. This is filesystem-driven rather than
relying on each subpackage's `__init__.py` exports, so dropping a new file
into one of those folders (e.g. a new retriever module) is enough for it to
show up here — no manual registration required.

Convention: every component class must have:
  - A `name` class attribute (str) — used as its unique identifier.
  - A `build(**resources)` classmethod — called by the API to instantiate it.
    Available resource keys: collection, embed_model, llm_client, llm_model.
"""
import importlib
import inspect
import pkgutil
from typing import Any

import backend.components as _components_pkg

_CATEGORY_METHODS = {
    "retrievers": "retrieve",
    "rerankers": "rerank",
    "generators": "generate",
}


def _annotation_to_str(annotation: Any) -> str | None:
    if annotation is inspect.Parameter.empty:
        return None
    if isinstance(annotation, str):
        return annotation
    return getattr(annotation, "__name__", str(annotation))


def _iter_component_classes():
    """Yield (category, method_name, cls) for every discovered component class."""
    for sub in sorted(pkgutil.iter_modules(_components_pkg.__path__), key=lambda m: m.name):
        method_name = _CATEGORY_METHODS.get(sub.name)
        if not sub.ispkg or method_name is None:
            continue
        subpkg = importlib.import_module(f"backend.components.{sub.name}")
        for mod_info in sorted(pkgutil.iter_modules(subpkg.__path__), key=lambda m: m.name):
            module = importlib.import_module(f"backend.components.{sub.name}.{mod_info.name}")
            for _, cls in inspect.getmembers(module, inspect.isclass):
                if cls.__module__ != module.__name__:
                    continue
                if not hasattr(cls, method_name):
                    continue
                yield sub.name, method_name, cls


def _describe_class(cls: type, method_name: str) -> dict:
    params: list[dict] = []
    raw_name = getattr(cls, "name", None)
    default_name = raw_name if isinstance(raw_name, str) else None

    try:
        signature = inspect.signature(cls.__init__)
    except (TypeError, ValueError):
        signature = None

    if signature is not None:
        for param_name, param in signature.parameters.items():
            if param_name == "self":
                continue
            if param.kind in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD):
                continue
            has_default = param.default is not inspect.Parameter.empty
            params.append({
                "name": param_name,
                "type": _annotation_to_str(param.annotation),
                "default": param.default if has_default else None,
                "required": not has_default,
            })
            # Fall back to __init__ name param only when no class-level name exists
            if default_name is None and param_name == "name" and has_default and isinstance(param.default, str):
                default_name = param.default

    return {
        "name": cls.__name__,
        "module": cls.__module__,
        "docstring": inspect.getdoc(cls),
        "default_name": default_name,
        "parameters": params,
        "interface_method": method_name,
    }


def discover_components() -> list[dict]:
    """Scan backend.components.* and report every component class found."""
    categories: dict[str, list] = {}
    for category, method_name, cls in _iter_component_classes():
        categories.setdefault(category, []).append(_describe_class(cls, method_name))
    return [
        {"category": cat, "components": sorted(comps, key=lambda c: c["name"])}
        for cat, comps in sorted(categories.items())
    ]


def resolve_components() -> dict[str, type]:
    """Return a flat mapping of component name -> class for all discovered components.

    Only includes components that follow the convention of having a `name` class
    attribute and a `build` classmethod.
    """
    result: dict[str, type] = {}
    for _, _, cls in _iter_component_classes():
        raw_name = getattr(cls, "name", None)
        if not isinstance(raw_name, str):
            continue
        if not hasattr(cls, "build"):
            continue
        result[raw_name] = cls
    return result
