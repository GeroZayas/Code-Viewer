from fastapi import FastAPI, Request, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import get_lexer_by_name
from pygments.styles import get_style_by_name

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

# Generate CSS for Pygments
style = get_style_by_name('monokai')
formatter = HtmlFormatter(style=style)
pygments_css = formatter.get_style_defs('.highlight')

# Write Pygments CSS to static file
with open('static/css/pygments.css', 'w') as f:
    f.write(pygments_css)

@app.get("/" or "/home")
async def get_home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/highlight")
async def highlight_code(request: Request):
    try:
        data = await request.json()
        code = data.get('code', '')
        language = data.get('language', 'python')
        
        # Get the lexer for the specified language
        lexer = get_lexer_by_name(language, stripall=True)
        
        # Highlight the code
        highlighted = highlight(code, lexer, formatter)
        
        return JSONResponse({
            "highlighted_code": highlighted
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/about")
async def get_about(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})
