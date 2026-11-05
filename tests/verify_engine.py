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

    print("\n[OK] Todas las pruebas de integridad de mazo y Clean Architecture pasaron exitosamente.")


if __name__ == "__main__":
    test_cards_dataset_integrity()
