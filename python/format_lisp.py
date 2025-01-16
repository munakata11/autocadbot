import os
import sys

def format_lisp_file(input_file_path):
    # カレントディレクトリを表示
    print(f"Current working directory: {os.getcwd()}")
    print(f"Processing file: {input_file_path}")

    # ファイルを読み込む
    with open(input_file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # 最初の開き括弧のインデックスを見つける
    first_paren = content.find('(')

    # 最後の閉じ括弧のインデックスを見つける
    last_paren = content.rfind(')')
    if first_paren == -1 or last_paren == -1:
        raise ValueError("括弧が見つかりませんでした")

    # Start Generation Here
    lisp_code = content[first_paren:last_paren+1]
    formatted_content = f"(defun *error* (msg) (setvar \"osmode\" old_osmode))(defun c:code (){lisp_code})"

    # 結果を同じディレクトリのdirection.lspに上書き保存
    output_file_path = os.path.join(os.path.dirname(input_file_path), 'direction.lsp')
    with open(output_file_path, 'w', encoding='utf-8') as file:
        file.write(formatted_content)
    print(f"Formatted file saved to: {output_file_path}")

# メインの実行部分
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用方法: python format_lisp.py <input_file_path>")
        sys.exit(1)
        
    input_file_path = sys.argv[1]
    try:
        format_lisp_file(input_file_path)
        print("整形が完了しました")
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        sys.exit(1)