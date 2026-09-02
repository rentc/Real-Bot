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

def build_updated_flow():
    elements = []
    
    # Title
    t_box = create_element("rectangle", 240, 20, 760, 55, strokeColor="#06c755", backgroundColor="#e6fcf5", strokeWidth=2)
    t_txt = create_element("text", 260, 35, 720, 25, text="UPDATED WORKFLOW: IMAGE INTENT DISAMBIGUATION & ORDER LIFECYCLE", fontSize=16, strokeColor="#0ca678")
    elements.extend([t_box, t_txt])

    # 1. Incoming Image
    add_box(elements, 470, 100, 300, 60, 
            "Incoming Image in LINE Group", 
            "Could be Payment Slip OR Handwritten Cable BOQ", 
            strokeColor="#06c755", bgColor="#ebfbee", textColor="#2b8a3e")

    # Arrow -> Check pending order
    add_arrow(elements, 620, 160, 620, 195)

    # 2. Check pending order
    add_box(elements, 460, 195, 320, 65, 
            "Pending Order Exists for Group?", 
            "ordersService.findPendingOrderForGroup(groupId)", 
            strokeColor="#f08c00", bgColor="#fff9db", textColor="#e67700")

    # If pending order exists -> AI Slip Check
    add_arrow(elements, 620, 260, 620, 295, label="Pending Order Found", color="#f08c00")
    
    # 3. Gemini Vision Slip Check
    add_box(elements, 450, 295, 340, 65, 
            "Gemini Vision: verifyPaymentSlip()", 
            "Checks if image is bank slip & extracts details", 
            strokeColor="#1971c2", bgColor="#e7f5ff", textColor="#1864ab")

    # Branch A: isSlip == true
    add_arrow(elements, 790, 327, 910, 327, label="isSlip: TRUE", color="#2b8a3e")
    add_box(elements, 910, 295, 250, 65, 
            "Verify Amount & Bank Ref", 
            "Math.abs(slipAmount - orderTotal) < 1", 
            strokeColor="#1971c2", bgColor="#e7f5ff", textColor="#1864ab")
    
    add_arrow(elements, 1035, 360, 1035, 400)
    add_box(elements, 910, 400, 250, 65, 
            "Mark Order PAID & Send Receipt", 
            "Order status -> PAID\nBot replies confirmation + RC-xxxx", 
            strokeColor="#2f9e44", bgColor="#ebfbee", textColor="#2b8a3e")

    # Branch B: isSlip == false (FIXED: FALL THROUGH!)
    add_arrow(elements, 620, 360, 620, 410, label="isSlip: FALSE (Fall Through)", color="#7048e8")
    
    # Also if NO pending order
    add_arrow(elements, 460, 227, 340, 227, label="No Pending Order", color="#495057")
    add_arrow(elements, 340, 227, 470, 442)

    # 4. Quotation Extraction Fallback
    add_box(elements, 450, 410, 340, 75, 
            "Gemini Vision: extractQuotationFromMedia()", 
            "Extracts cable items (e.g. NYY 4x1.5, 3x1.5, quantities)\nChecks for handwritten BOQ or cable specs", 
            strokeColor="#7048e8", bgColor="#f3d9fa", textColor="#5f3dc4")

    # If items extracted
    add_arrow(elements, 450, 447, 300, 447, label="Items Found", color="#2b8a3e")
    add_box(elements, 50, 415, 250, 70, 
            "Process Quotation Request", 
            "Match catalog prices ➔ Draft QT-xxxx\nSubmit to Admin for Approval", 
            strokeColor="#2f9e44", bgColor="#ebfbee", textColor="#2b8a3e")

    # If no items extracted
    add_arrow(elements, 620, 485, 620, 530, label="No Items Detected", color="#e03131")
    add_box(elements, 470, 530, 300, 65, 
            "Inform User / Unreadable Image", 
            "Bot: '⚠️ ไม่พบสลิปหรือรายการขอราคาที่ชัดเจน'\nAsks user to provide clear photo or text", 
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
    data = build_updated_flow()
    with open("/Users/rentconnected/Real-Bot-Repo/quotation_to_payment_workflow.excalidraw", "w") as f:
        json.dump(data, f, indent=2)
    print("Successfully updated quotation_to_payment_workflow.excalidraw")
