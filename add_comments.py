import os
import json
import re

"""
загружает переданный вами файл tree.json, рекурсивно обходит его структуру и добавляет комментарий с путем к файлу в каждый реальный файл проекта на диске.
Правила добавления комментариев, заложенные в скрипт:
HTML-файлы (.html): Вставляет комментарий сразу после тега <html lang="..."> (как мы обсуждали ранее, чтобы не ломать DOCTYPE).
JavaScript / JSX / MJS файлы (.js, .jsx, .mjs): Добавляет строчный комментарий // путь в самую первую строку файла.
CSS файлы (.css): Добавляет блочный комментарий /* путь */ в самую первую строку.
JSON файлы (.json): Из соображений валидности JSON (так как комментарии в стандартном JSON запрещены спецификацией) скрипт аккуратно пропускает их, чтобы не сломать парсеры.
Как запустить:
1. Убедитесь, что ваш файл tree.json находится в той же папке.
В терминале выполните:

python add_comments.py
"""

def process_node(node):
    """Рекурсивно обходит дерево из JSON и добавляет комментарии в файлы."""
    if node.get("type") == "directory":
        for child in node.get("contents", []):
            process_node(child)
            
    elif node.get("type") == "file":
        file_path = node.get("path")
        
        # Проверяем, существует ли файл на диске
        if not os.path.isfile(file_path):
            print(f"[Пропущено] Файл не найден на диске: {file_path}")
            return
            
        ext = os.path.splitext(file_path)[1].lower()
        
        # Пропускаем JSON-файлы (в чистом JSON комментарии запрещены стандартом)
        if ext == '.json':
            print(f"[Пропущено JSON] {file_path}")
            return
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            print(f"[Ошибка чтения] {file_path}: {e}")
            return
            
        # Проверяем, не добавлен ли уже такой комментарий, чтобы не дублировать
        if file_path in content:
            print(f"[Уже есть] {file_path}")
            return
            
        updated_content = None
        
        # 1. Правила для HTML: вставляем сразу после <html ...>
        if ext == '.html':
            # Ищем тег <html ...> с учетом возможных атрибутов (lang, etc.)
            match = re.search(r'(<html[^>]*>)', content, re.IGNORECASE)
            if match:
                html_tag = match.group(1)
                comment = f"\n  <!-- {file_path} -->"
                updated_content = content.replace(html_tag, html_tag + comment, 1)
            else:
                # Если тег не найден, просто пишем в самое начало
                updated_content = f"<!-- {file_path} -->\n" + content
                
        # 2. Правила для JavaScript / JSX / MJS: добавляем в самое начало
        elif ext in ['.js', '.jsx', '.mjs']:
            comment = f"// {file_path}\n"
            updated_content = comment + content
            
        # 3. Правила для CSS: добавляем в самое начало
        elif ext == '.css':
            comment = f"/* {file_path} */\n"
            updated_content = comment + content
            
        # Если файл успешно изменен — сохраняем
        if updated_content:
            try:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(updated_content)
                print(f"[Успешно] Комментарий добавлен в: {file_path}")
            except Exception as e:
                print(f"[Ошибка записи] {file_path}: {e}")

if __name__ == "__main__":
    json_filename = "tree.json"
    
    if not os.path.exists(json_filename):
        print(f"Ошибка: файл {json_filename} не найден в текущей директории!")
    else:
        with open(json_filename, "r", encoding="utf-8") as f:
            tree_data = json.load(f)

        print("Начало обработки файлов по структуре из JSON...")
        process_node(tree_data)
        print("Готово!")