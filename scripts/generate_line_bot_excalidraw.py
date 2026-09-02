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
            "fontSize": kwargs.get("fontSize", 15),
            "fontFamily": kwargs.get("fontFamily", 1),
            "textAlign": kwargs.get("textAlign", "center"),
            "verticalAlign": kwargs.get("verticalAlign", "middle"),
            "baseline": kwargs.get("fontSize", 15) - 2,
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
    fontSize = 14 if "\n" in full_text else 15
    text = create_element(
        "text", x + 10, y + (height - (fontSize * (2 if subtitle else 1) * 1.3)) / 2,
        width - 20, height,
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
        mid_y = start_y + dy/2 - 10
        txt = create_element(
            "text", mid_x, mid_y, 100, 20,
            text=label,
            fontSize=12,
            strokeColor=color,
            textAlign="left"
        )
        elements.append(txt)

def build_bot_flow():
    elements = []
    
    # Title
    t_box = create_element("rectangle", 280, 20, 640, 55, strokeColor="#06c755", backgroundColor="#e6fcf5", strokeWidth=2)
    t_txt = create_element("text", 300, 35, 600, 25, text="REAL-BOT (LINE ถังรูป) ARCHITECTURE & WORKFLOW", fontSize=18, strokeColor="#0ca678")
    elements.extend([t_box, t_txt])
    
    # 1. LINE Chat Group
    add_box(elements, 470, 100, 260, 60, "LINE Group Event", "User sends image / joins group", strokeColor="#06c755", bgColor="#ebfbee", textColor="#2b8a3e")
    
    # Arrow -> Webhook
    add_arrow(elements, 600, 160, 600, 200)
    
    # 2. Firebase Cloud Function Webhook
    add_box(elements, 460, 200, 280, 65, "Firebase Cloud Function", "POST /webhook (Signature Check)", strokeColor="#e8590c", bgColor="#fff4e6", textColor="#d9480f")
    
    # Arrow -> Event Dispatcher
    add_arrow(elements, 600, 265, 600, 305)
    
    # 3. Event Router
    add_box(elements, 460, 305, 280, 60, "Event Type Router", "join | memberJoined | leave | message", strokeColor="#1971c2", bgColor="#e7f5ff", textColor="#1864ab")
    
    # Route: Image / Media Message
    add_arrow(elements, 740, 335, 840, 400, label="Image / Media", color="#1971c2")
    add_box(elements, 740, 400, 240, 65, "Download Media Buffer", "line.getMessageContent(messageId)", strokeColor="#1971c2", bgColor="#e7f5ff", textColor="#1864ab")
    
    add_arrow(elements, 860, 465, 860, 505)
    add_box(elements, 740, 505, 240, 65, "Upload to Firebase Storage", "Save in images bucket & get URL", strokeColor="#f08c00", bgColor="#fff9db", textColor="#e67700")
    
    add_arrow(elements, 860, 570, 860, 610)
    add_box(elements, 740, 610, 240, 65, "Write to Firestore", "Save metadata, groupId, userId", strokeColor="#e03131", bgColor="#ffe3e3", textColor="#c92a2a")
    
    # Route: Join / MemberJoined
    add_arrow(elements, 460, 335, 360, 400, label="Join / Member", color="#2b8a3e")
    add_box(elements, 240, 400, 240, 65, "Fetch Member Profile", "line.getGroupMemberProfile()", strokeColor="#2f9e44", bgColor="#ebfbee", textColor="#2b8a3e")
    
    add_arrow(elements, 360, 465, 360, 505)
    add_box(elements, 240, 505, 240, 65, "Prepare Welcome Message", "Flex Message / Text Template", strokeColor="#2f9e44", bgColor="#ebfbee", textColor="#2b8a3e")
    
    # Both converge to LINE Reply
    add_arrow(elements, 360, 570, 530, 710)
    add_arrow(elements, 860, 675, 670, 710)
    
    # Response
    add_box(elements, 460, 710, 280, 65, "LINE Messaging API Reply", "line.reply(replyToken, messages)", strokeColor="#06c755", bgColor="#ebfbee", textColor="#2b8a3e")
    
    return {
        "type": "excalidraw",
        "version": 2,
        "source": "https://excalidraw.com",
        "elements": elements,
        "appState": {"gridSize": None, "viewBackgroundColor": "#ffffff"},
        "files": {}
    }

if __name__ == "__main__":
    data = build_bot_flow()
    with open("/Users/rentconnected/Real-Bot-Repo/line_bot_workflow.excalidraw", "w") as f:
        json.dump(data, f, indent=2)
    print("Successfully generated line_bot_workflow.excalidraw")
