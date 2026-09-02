import json
import uuid
import random

def create_element(elem_type, x, y, width, height, **kwargs):
    elem_id = kwargs.get("id", str(uuid.uuid4())[:8])
    base = {
        "id": elem_id,
        "type": elem_type,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "angle": 0,
        "strokeColor": kwargs.get("strokeColor", "#1e1e1e"),
        "backgroundColor": kwargs.get("backgroundColor", "transparent"),
        "fillStyle": kwargs.get("fillStyle", "solid"),
        "strokeWidth": kwargs.get("strokeWidth", 2),
        "strokeStyle": kwargs.get("strokeStyle", "solid"),
        "roughness": kwargs.get("roughness", 1),
        "opacity": 100,
        "groupIds": kwargs.get("groupIds", []),
        "frameId": None,
        "roundness": kwargs.get("roundness", {"type": 3}),
        "seed": random.randint(10000, 99999),
        "version": 1,
        "versionNonce": random.randint(10000, 99999),
        "isDeleted": False,
        "boundElements": [],
        "updated": 1,
        "link": None,
        "locked": False
    }
    if elem_type == "text":
        base.update({
            "text": kwargs.get("text", ""),
            "fontSize": kwargs.get("fontSize", 13),
            "fontFamily": kwargs.get("fontFamily", 1),
            "textAlign": kwargs.get("textAlign", "center"),
            "verticalAlign": kwargs.get("verticalAlign", "middle"),
            "baseline": kwargs.get("fontSize", 13) - 2,
            "containerId": kwargs.get("containerId", None),
            "originalText": kwargs.get("text", ""),
            "lineHeight": kwargs.get("lineHeight", 1.25),
            "roundness": None
        })
    elif elem_type == "arrow" or elem_type == "line":
        base.update({
            "points": kwargs.get("points", [[0, 0], [width, height]]),
            "lastCommittedPoint": None,
            "startBinding": kwargs.get("startBinding", None),
            "endBinding": kwargs.get("endBinding", None),
            "startArrowhead": kwargs.get("startArrowhead", None),
            "endArrowhead": kwargs.get("endArrowhead", "arrow"),
            "roundness": {"type": 2}
        })
    return base

def add_box(elements, x, y, width, height, title, subtitle="", strokeColor="#1e1e1e", bgColor="#ffffff", textColor="#1e1e1e"):
    box_id = f"b_{len(elements)}"
    box = create_element(
        "rectangle", x, y, width, height,
        id=box_id,
        strokeColor=strokeColor,
        backgroundColor=bgColor,
        fillStyle="solid",
        strokeWidth=2,
        roundness={"type": 3}
    )
    full_text = title if not subtitle else f"{title}\n{subtitle}"
    fontSize = 12 if full_text.count("\n") >= 2 else (13 if full_text.count("\n") == 1 else 14)
    text = create_element(
        "text", x + 8, y + (height - (fontSize * (full_text.count("\n") + 1) * 1.3)) / 2,
        width - 16, height,
        text=full_text,
        fontSize=fontSize,
        strokeColor=textColor,
        textAlign="center",
        verticalAlign="middle"
    )
    elements.extend([box, text])
    return box_id

def add_arrow(elements, start_x, start_y, end_x, end_y, label="", color="#495057"):
    dx = end_x - start_x
    dy = end_y - start_y
    arrow = create_element(
        "arrow", start_x, start_y, dx, dy,
        points=[[0, 0], [dx, dy]],
        strokeColor=color,
        strokeWidth=2,
        endArrowhead="arrow"
    )
    elements.append(arrow)
    if label:
        mid_x = start_x + dx/2 + 5
        mid_y = start_y + dy/2 - 12
        txt = create_element(
            "text", mid_x, mid_y, 140, 20,
            text=label,
            fontSize=11,
            strokeColor=color,
            textAlign="left"
        )
        elements.append(txt)

def build_text_input_flow():
    elements = []
    
    # Title
    t_box = create_element("rectangle", 240, 20, 780, 55, strokeColor="#1971c2", backgroundColor="#e7f5ff", strokeWidth=2)
    t_txt = create_element("text", 260, 35, 740, 25, text="TEXT MESSAGE INPUT & INTENT ROUTING WORKFLOW", fontSize=16, strokeColor="#1864ab")
    elements.extend([t_box, t_txt])

    # 1. Incoming Text
    add_box(elements, 480, 100, 300, 60, 
            "Incoming Text Message", 
            "LINE Group / 1-on-1 Chat", 
            strokeColor="#06c755", bgColor="#ebfbee", textColor="#2b8a3e")

    # Arrow -> Admin / Relevance Filter
    add_arrow(elements, 630, 160, 630, 200)

    # 2. Relevance & Role Filter
    add_box(elements, 460, 200, 340, 70, 
            "Policy & Relevance Filter", 
            "Is Admin? (Allow only #command or quote keywords)\nHas keyword (ราคา, quote) or #command or @bot mention?", 
            strokeColor="#f08c00", bgColor="#fff9db", textColor="#e67700")

    # If Not Relevant -> Discard
    add_arrow(elements, 800, 235, 930, 235, label="Not Relevant", color="#868e96")
    add_box(elements, 930, 205, 200, 60, 
            "Silently Discard", 
            "No storage, no bot reply\n(Prevents chat spam)", 
            strokeColor="#868e96", bgColor="#f8f9fa", textColor="#495057")

    # If Relevant -> Update Session
    add_arrow(elements, 630, 270, 630, 310, label="Relevant Message", color="#2b8a3e")
    add_box(elements, 470, 310, 320, 55, 
            "Upsert Active Session", 
            "sessionsService.upsertSession(groupId, userId)", 
            strokeColor="#1971c2", bgColor="#e7f5ff", textColor="#1864ab")

    # Arrow -> Command vs AI Router
    add_arrow(elements, 630, 365, 630, 405)

    # 3. Router Gate: Is it #order command or Quotation request?
    add_box(elements, 460, 405, 340, 65, 
            "Intent Router", 
            "Does text start with '#order <QT-ID>' or natural text?", 
            strokeColor="#7048e8", bgColor="#f3d9fa", textColor="#5f3dc4")

    # Branch A: #order <QT-ID>
    add_arrow(elements, 460, 437, 260, 437, label="Starts with '#order'", color="#1971c2")
    add_box(elements, 20, 405, 240, 70, 
            "Order Creation Flow", 
            "Verify QT-ID is APPROVED\nGenerate Order OD-xxxx (PENDING)", 
            strokeColor="#1971c2", bgColor="#e7f5ff", textColor="#1864ab")

    add_arrow(elements, 140, 475, 140, 515)
    add_box(elements, 20, 515, 240, 75, 
            "Reply Order & Bank Details", 
            "Send Order Number\nKasikorn Bank transfer info\nPrompt user to upload slip", 
            strokeColor="#2f9e44", bgColor="#ebfbee", textColor="#2b8a3e")

    # Branch B: Natural Language Quotation Request
    add_arrow(elements, 630, 470, 630, 510, label="Natural Language / #quote", color="#7048e8")
    add_box(elements, 460, 510, 340, 70, 
            "Gemini AI Text Extraction", 
            "aiService.extractQuotationRequest(text)\nExtracts: cable type, size, quantity", 
            strokeColor="#7048e8", bgColor="#f3d9fa", textColor="#5f3dc4")

    # Check extracted items
    add_arrow(elements, 630, 580, 630, 620)
    add_box(elements, 460, 620, 340, 60, 
            "Did AI Extract Valid Items?", 
            "items.length > 0 && intent == 'QUOTE' | 'PRICE'", 
            strokeColor="#e03131", bgColor="#fff5f5", textColor="#c92a2a")

    # Sub-branch B1: Items Found -> Create Quotation
    add_arrow(elements, 460, 650, 310, 650, label="Items Found", color="#2b8a3e")
    add_box(elements, 70, 615, 240, 75, 
            "Generate Draft Quotation", 
            "Match Product Catalog & Prices\nCalculate Subtotal + 7% VAT\nSubmit for Admin Approval", 
            strokeColor="#2f9e44", bgColor="#ebfbee", textColor="#2b8a3e")

    add_arrow(elements, 190, 690, 190, 730)
    add_box(elements, 60, 730, 260, 80, 
            "LINE Group Reply (2 Messages)", 
            "1. Itemized quotation summary + Total\n2. Admin approval notification + Link:\nhttps://real-bot-6a793.web.app/quotations", 
            strokeColor="#0ca678", bgColor="#e6fcf5", textColor="#099268")

    # Sub-branch B2: No Items Found -> Ask clarification
    add_arrow(elements, 800, 650, 930, 650, label="No Items Found", color="#e03131")
    add_box(elements, 930, 615, 230, 75, 
            "Clarification Reply", 
            "Bot: 'ไม่พบข้อมูลสินค้า กรุณาระบุ ชนิด\nขนาด และจำนวน เช่น ขอราคา NYY 4x6 100m'", 
            strokeColor="#e03131", bgColor="#ffe3e3", textColor="#c92a2a")

    return {
        "type": "excalidraw",
        "version": 2,
        "source": "https://excalidraw.com",
        "elements": elements,
        "appState": {"gridSize": None, "viewBackgroundColor": "#ffffff"},
        "files": {}
    }

if __name__ == "__main__":
    data = build_text_input_flow()
    with open("/Users/rentconnected/Real-Bot-Repo/text_input_workflow.excalidraw", "w") as f:
        json.dump(data, f, indent=2)
    print("Successfully generated text_input_workflow.excalidraw")
