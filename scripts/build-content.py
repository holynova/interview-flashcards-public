"""Export the JSON question bank for the browser and plain-text reading."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
questions = json.loads((root / 'content/questions.json').read_text())
assert [q['id'] for q in questions] == list(range(1, 33))
assert sum(len(q['followups']) for q in questions) == 19
assert all(isinstance(q['guide'], list) and isinstance(q['answer'], list) for q in questions)
(root / 'content/questions.js').write_text('window.QUESTIONS = ' + json.dumps(questions, ensure_ascii=False, indent=2) + ';\n')
text = '# 面试慢练\n\n本题库为通用面试练习示例，不代表任何个人履历。名称以简称或占位符呈现。\n\n'
for q in questions:
    text += f'## {q["id"]}. {q["question"]}\n\n答题思路\n\n- 考察：{q["intent"]}\n'
    text += ''.join('- ' + item + '\n' for item in q['guide'])
    text += '\n参考回答\n\n' + ''.join('- ' + item + '\n' for item in q['answer'])
    if q['followups']:
        text += '\n继续追问\n\n' + ''.join('- ' + item + '\n' for item in q['followups'])
    text += '\n'
(root / 'questions.txt').write_text(text)
