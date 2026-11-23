import re
with open("app/gantt/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(r"\"p-3 bg-slate-50 border border-slate-200 rounded-lg text-center\"", "\"p-3 bg-slate-50 border border-slate-200 rounded-lg text-center\"")
content = content.replace(r"\"text-xs font-semibold text-slate-600\"", "\"text-xs font-semibold text-slate-600\"")

with open("app/gantt/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

