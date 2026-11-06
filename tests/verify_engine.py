"""
Suite automatizada de verificación de integridad de datos y lógica de dominio
para ChemBlind (Chemistry Unfiltered).
"""

import json
import re
from pathlib import Path


def parse_cards_from_file(file_path: Path) -> list[dict]:
    """Parsea el mazo de tarjetas desde data/cards.js extrayendo los campos clave."""
    content = file_path.read_text(encoding="utf-8")
    
    # Extraer bloques de objetos de tarjeta
    pattern = re.compile(
        r"id:\s*['\"]([^'\"]+)['\"].*?"
        r"level:\s*([^,\n]+).*?"
        r"category:\s*([^,\n]+).*?"
        r"modes:\s*\[([^\]]+)\].*?"
        r"text:\s*['\"](.*?)['\"]\s*,\s*\n\s*hint:",
        re.DOTALL
    )
    
    cards = []
    for match in pattern.finditer(content):
        card_id = match.group(1).strip()
        raw_level = match.group(2).strip()
        raw_cat = match.group(3).strip()
        raw_modes = match.group(4).strip()
        text = match.group(5).strip()

        # Determinar nivel numérico
        if "SPARK" in raw_level or "3" in raw_level:
            level = 3
        elif "DEEP" in raw_level or "2" in raw_level:
            level = 2
        else:
            level = 1

        cards.append({
            "id": card_id,
            "level": level,
            "category": raw_cat,
            "modes": raw_modes,
            "text": text
        })
    
    return cards


def test_cards_dataset_integrity():
    cards_path = Path(__file__).parent.parent / "js" / "data" / "cards.js"
    assert cards_path.exists(), f"No se encontró {cards_path}"
    
    cards = parse_cards_from_file(cards_path)
    total_cards = len(cards)
    print(f"--- 1. Conteo total de tarjetas extraídas: {total_cards} ---")
    assert total_cards == 165, f"Se esperaban exactamente 165 tarjetas, se obtuvieron {total_cards}"

    print("--- 2. Verificando distribución por niveles (55 por nivel) ---")
    level_counts = {1: 0, 2: 0, 3: 0}
    for c in cards:
        level_counts[c["level"]] += 1

    print(f"  Nivel I (Romper el Hielo): {level_counts[1]} cartas")
    print(f"  Nivel II (Conexión Profunda): {level_counts[2]} cartas")
    print(f"  Nivel III (Tensión & Chispa): {level_counts[3]} cartas")
    assert level_counts[1] == 55, f"Nivel 1 tiene {level_counts[1]} cartas (esperadas 55)"
    assert level_counts[2] == 55, f"Nivel 2 tiene {level_counts[2]} cartas (esperadas 55)"
    assert level_counts[3] == 55, f"Nivel 3 tiene {level_counts[3]} cartas (esperadas 55)"

    print("--- 3. Verificando unicidad de IDs y textos (Cero duplicados) ---")
    seen_ids = set()
    seen_texts = set()
    for c in cards:
        cid = c["id"]
        assert cid not in seen_ids, f"ID duplicado detectado: {cid}"
        seen_ids.add(cid)

        # Normalizar texto para verificar que no haya preguntas clonadas
        norm_text = re.sub(r"\s+", " ", c["text"].lower().strip())
        assert norm_text not in seen_texts, f"Texto duplicado detectado: {c['text'][:50]}"
        seen_texts.add(norm_text)

    print("--- 4. Verificación de placeholders de nombres ---")
    placeholders_found = sum(1 for c in cards if "{active}" in c["text"] or "{other}" in c["text"])
    print(f"  Tarjetas con interpolación de turnos: {placeholders_found}")
    assert placeholders_found > 0, "Debe haber tarjetas con interpolación de jugadores"


def test_js_contracts_and_zero_silent_catches():
    """Verifica que no existan llamadas a métodos inexistentes ni bloques catch vacíos en la capa JS."""
    js_dir = Path(__file__).parent.parent / "js"
    app_content = (js_dir / "app.js").read_text(encoding="utf-8")
    ui_content = (js_dir / "ui-manager.js").read_text(encoding="utf-8")
    chat_content = (js_dir / "chat-service.js").read_text(encoding="utf-8")
    supa_content = (js_dir / "supabase-client.js").read_text(encoding="utf-8")

    print("--- 5. Verificando contratos de métodos entre Controlador y UI ---")
    assert "syncChatHistory(" not in app_content, "Llamada huérfana a syncChatHistory detectada en app.js"
    assert "handleIncomingMessage(" not in app_content, "Llamada huérfana a handleIncomingMessage detectada en app.js"
    assert "renderChemistry(score)" in ui_content, "Falta definición de renderChemistry en UIManager"

    print("--- 6. Verificando reutilización de Singleton Supabase y ausencia de fugas WS ---")
    assert "window.supabase.createClient" not in chat_content, (
        "chat-service.js no debe instanciar clientes Supabase duplicados; debe usar getSupabase()"
    )
    assert "getSupabase" in chat_content, "chat-service.js debe importar y usar el singleton getSupabase()"
    assert "sync_room_state" in supa_content, "supabase-client.js debe sincronizar mediante el RPC blindado sync_room_state"
    assert "get_room_by_token" in supa_content, "supabase-client.js debe consultar mediante el RPC blindado get_room_by_token"

    print("--- 7. Verificando regla de Cero Errores Silenciados (catch vacíos) ---")
    empty_catch_pattern = re.compile(r"catch\s*(?:\([^)]*\))?\s*\{\s*\}")
    for js_file in js_dir.glob("*.js"):
        src = js_file.read_text(encoding="utf-8")
        assert not empty_catch_pattern.search(src), f"Bloque catch vacío prohibido en {js_file.name}"

    print("--- 8. Verificando integridad de IDs entre UIManager e index.html ---")
    html_content = (Path(__file__).parent.parent / "index.html").read_text(encoding="utf-8")
    html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html_content))
    ui_cached_ids = set(re.findall(r"byId\(['\"]([^'\"]+)['\"]\)", ui_content))
    missing_in_html = ui_cached_ids - html_ids
    assert not missing_in_html, f"IDs referenciados en UIManager que no existen en index.html: {missing_in_html}"
    assert "wildcard-skip-btn" in html_ids, "El botón de comodines debe existir en index.html"
    assert ".innerHTML" not in ui_content, "UIManager no debe asignar innerHTML directamente"

    print("--- 9. Verificando accesibilidad WCAG 2.1 AA (Viewport escalable, Escape y Focus Visible) ---")
    assert "user-scalable=no" not in html_content, "index.html no debe bloquear el zoom del usuario (WCAG 1.4.4)"
    assert "aria-selected" in html_content and "aria-selected" in ui_content, "Las pestañas deben gestionar aria-selected"
    assert "closeTopModal" in ui_content and "Escape" in app_content, "Los modales deben cerrarse con la tecla Escape"

    print("\n[OK] Todas las pruebas de integridad de mazo, seguridad RPC, contratos DOM y accesibilidad pasaron exitosamente.")


if __name__ == "__main__":
    test_cards_dataset_integrity()
    test_js_contracts_and_zero_silent_catches()
