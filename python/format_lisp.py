import re
import os
import sys

def process_lisp_code_with_error_handling(lisp_code: str) -> str:
    """
    AutoLISPコードを処理し、以下を実行:
      1. (setq ... (getpoint ...)) の直前に (setvar "osmode" old_osmode) を挿入。
         - ただし、直前に既に (setvar "osmode" old_osmode) がある場合は挿入しない。
      2. (setvar "osmode" old_osmode) が連続しないようにする。
         - 間に (setvar "osmode" 0) がなければ次の (setvar "osmode" old_osmode) は挿入しない。
      3. 冒頭に (setq old_osmode (getvar "osmode")) を挿入し、(setq *error* ...) を追加。
      4. 最終的に (defun c:code () ... (princ) ) でラップ。

    Args:
        lisp_code (str): AutoLISPのコード全体。

    Returns:
        str: 処理後のLISPコード。
    """
    # エラー処理のコードテンプレート（注釈なし）
    error_handling_code = """
(setq *error* (lambda (errmsg)
  (if (/= errmsg "Function cancelled")
    (princ (strcat "\\nエラー: " errmsg))
  )
  (setvar "osmode" old_osmode)
  (princ)
))
"""

    # --- 前処理：古い関数定義や末尾の ) を削除 ---
    # 1) (defun c:～) 行を削除
    lisp_body = re.sub(r'^\(defun c:[^\)]+\)\s*\n?', '', lisp_code, flags=re.MULTILINE)
    # 2) (defun c: が存在する場合のみ末尾の ) を削除
    if re.search(r'\(defun c:[^\)]+\)', lisp_code):
        # ここでの変更: 最後の ) のみを削除
        lisp_body = lisp_body.rstrip(')')  # 末尾の ) を削除
    # 前後空白除去
    lisp_body = lisp_body.strip()

    # --- 行単位で解析 ---
    lines = lisp_body.split("\n")
    new_lines = []
    last_setvar_state = None  # 直近で追加・検出した setvar は "old_osmode" or "0" or None

    for i, line in enumerate(lines):
        # ------------------------------------------------------------
        # 1) getpoint を含む (setq の直前に (setvar "osmode" old_osmode) を入れたい
        #    ただし、直前がすでに old_osmode なら挿入しない
        # ------------------------------------------------------------
        if re.search(r'\(setq[^)]*\(getpoint', line):
            # 直前がすでに "old_osmode" でなければ追加
            if last_setvar_state != "old_osmode":
                new_lines.append('(setvar "osmode" old_osmode)')
                last_setvar_state = "old_osmode"
            # その後に現在の行を追加
            new_lines.append(line)
            continue

        # ------------------------------------------------------------
        # 2) (setvar "osmode" old_osmode) が連続しないようにする
        #    - 間に (setvar "osmode" 0) があればリセット
        # ------------------------------------------------------------
        if '(setvar "osmode" old_osmode)' in line:
            # すでに old_osmode のままなら追加しない
            if last_setvar_state == "old_osmode":
                # 重複を避けるためスキップ
                continue
            # そうでない場合は追加し、状態を更新
            new_lines.append(line)
            last_setvar_state = "old_osmode"
            continue

        # ------------------------------------------------------------
        # 3) (setvar "osmode" 0) の行があれば状態を "0" にリセット
        # ------------------------------------------------------------
        if '(setvar "osmode" 0)' in line:
            new_lines.append(line)
            last_setvar_state = "0"
            continue

        # ------------------------------------------------------------
        # (command の直前に (setvar "osmode" 0) を追加
        #    ただし、(command "layer" の場合は追加しない
        # ------------------------------------------------------------
        if re.search(r'\(command\s+"(?!layer)[^"]*"', line) and last_setvar_state != "0":
            new_lines.append('(setvar "osmode" 0)')
            last_setvar_state = "0"
        
        new_lines.append(line)  # (command の行を保持

    # --- 後処理：先頭に (setq old_osmode (getvar "osmode")) とエラー処理を追加、末尾に (setvar "osmode" old_osmode) を挿入 ---
    body_str = "\n".join(new_lines)

    # --- 最後の ) を削除 ---
    if re.search(r'\(defun c:[^\)]+\)', lisp_code):  # (defun c: が存在する場合
        body_str = body_str.rstrip(')')  # 末尾の ) を削除

    body_str = f'(setq old_osmode (getvar "osmode"))\n{error_handling_code.strip()}\n{body_str}\n(setvar "osmode" old_osmode)'

    # --- 関数定義でラップ + (princ) で終了 ---
    wrapped_code = f"(defun c:code ()\n{body_str}\n(princ)\n)"  # ここでの変更はなし
    return wrapped_code


def format_lisp_file():
    """
    ../lisp_files/direction2.lsp を読み込み、整形後のコードを ../lisp_files/direction.lsp に保存する。
    """
    input_file_path = "../lisp_files/direction2.lsp"
    output_file_path = "../lisp_files/direction.lsp"

    # ファイル読み込み
    try:
        with open(input_file_path, 'r', encoding='utf-8') as file:
            content = file.read()
    except FileNotFoundError:
        print(f"エラー: {input_file_path} が見つかりませんでした。")
        sys.exit(1)

    # Lispコードを整形
    formatted_content = process_lisp_code_with_error_handling(content)

    # 整形後の内容を保存
    with open(output_file_path, 'w', encoding='utf-8') as file:
        file.write(formatted_content)

    print(f"Formatted file saved to: {output_file_path}")


# メイン処理部分
if __name__ == "__main__":
    try:
        format_lisp_file()
        print("整形が完了しました")
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        sys.exit(1)
