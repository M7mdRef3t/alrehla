import re

def check_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex for opening and closing tags (ignoring self-closing)
    # This is rough but can help find mismatches
    tags = re.findall(r'<(/?)([a-zA-Z0-9\.]+)([^>]*?)(/?)>', content)
    
    stack = []
    for is_close, tag_name, attrs, is_self_close in tags:
        if is_self_close or tag_name in ['input', 'br', 'hr', 'img']:
            continue
        
        if is_close:
            if not stack:
                print(f"Error: Found closing tag </{tag_name}> but stack is empty")
                continue
            last = stack.pop()
            if last != tag_name:
                print(f"Error: Mismatch! Expected </{last}> but found </{tag_name}>")
        else:
            stack.append(tag_name)
    
    if stack:
        print(f"Error: Still have open tags: {stack}")
    else:
        print("All tags balanced!")

check_balance(r'c:\Users\ty\Downloads\Dawayir-main\Dawayir-main\src\components\Landing.tsx')
