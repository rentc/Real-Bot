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
            "fontSize": kwargs.get("fontSize", 16),
            "fontFamily": kwargs.get("fontFamily", 1),
            "textAlign": kwargs.get("textAlign", "center"),
            "verticalAlign": kwargs.get("verticalAlign", "middle"),
            "baseline": kwargs.get("fontSize", 16) - 2,
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
    box_id = f"box_{len(elements)}"
    text_id = f"text_{len(elements)}"
    
    # Box
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
    fontSize = 15 if "\n" in full_text else 16
    
    text = create_element(
        "text", x + 10, y + (height - (fontSize * (2 if subtitle else 1) * 1.3)) / 2,
        width - 20, height,
        id=text_id,
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
        mid_x = start_x + dx/2 + 8
        mid_y = start_y + dy/2 - 10
        txt = create_element(
            "text", mid_x, mid_y, 80, 20,
            text=label,
            fontSize=13,
            strokeColor=color,
            textAlign="left"
        )
        elements.append(txt)

def build_excalidraw_flow():
    elements = []
    
    # Title Block
    t_box = create_element("rectangle", 260, 20, 680, 60, strokeColor="#1971c2", backgroundColor="#e7f5ff", strokeWidth=2)
    t_txt = create_element("text", 280, 36, 640, 30, text="ANTIGRAVITY AGENT ARCHITECTURE & EXECUTION FLOW", fontSize=18, strokeColor="#1864ab")
    elements.extend([t_box, t_txt])
    
    # Nodes
    # 1. User Input
    add_box(elements, 460, 110, 280, 65, "1. User Prompt & Metadata", "Workspace, settings, files", strokeColor="#1971c2", bgColor="#e7f5ff", textColor="#1864ab")
    
    # Arrow 1 -> 2
    add_arrow(elements, 600, 175, 600, 210)
    
    # 2. KI & Repo Scan
    add_box(elements, 460, 210, 280, 65, "2. Knowledge Items (KI) Check", "Review repo patterns & guidelines", strokeColor="#0c8599", bgColor="#e3fafc", textColor="#0b7285")
    
    # Arrow 2 -> 3
    add_arrow(elements, 600, 275, 600, 310)
    
    # 3. Decision Gate
    add_box(elements, 450, 310, 300, 75, "3. Planning Mode Gate", "Trivial / Simple vs Architectural / Risky?", strokeColor="#f08c00", bgColor="#fff9db", textColor="#e67700")
    
    # Branch A: Simple -> Direct
    add_arrow(elements, 450, 347, 260, 347, label="Minor / Simple", color="#2b8a3e")
    add_box(elements, 70, 315, 190, 65, "Fast Path (Direct)", "Trivial edit, explanation", strokeColor="#2f9e44", bgColor="#ebfbee", textColor="#2b8a3e")
    add_arrow(elements, 165, 380, 165, 430)
    add_box(elements, 70, 430, 190, 65, "Direct Action & Answer", "Execute tool & reply directly", strokeColor="#2f9e44", bgColor="#ebfbee", textColor="#2b8a3e")
    add_arrow(elements, 165, 495, 165, 870)
    
    # Branch B: Planning Mode -> 4. Research
    add_arrow(elements, 600, 385, 600, 420, label="Complex / Plan", color="#7048e8")
    add_box(elements, 460, 420, 280, 65, "4. Deep Research Phase", "Grep, view files, docs, NO code edits", strokeColor="#7048e8", bgColor="#f3d9fa", textColor="#5f3dc4")
    
    # 5. Implementation Plan
    add_arrow(elements, 600, 485, 600, 520)
    add_box(elements, 460, 520, 280, 65, "5. Draft Implementation Plan", "Create implementation_plan.md", strokeColor="#7048e8", bgColor="#f8f0fc", textColor="#5f3dc4")
    
    # 6. User Review Gate (STOP)
    add_arrow(elements, 600, 585, 600, 620)
    add_box(elements, 460, 620, 280, 65, "6. User Approval Gate", "HALT and wait for user confirmation", strokeColor="#e03131", bgColor="#ffe3e3", textColor="#c92a2a")
    
    # 7. Execution
    add_arrow(elements, 600, 685, 600, 720, label="Approved", color="#2b8a3e")
    add_box(elements, 460, 720, 280, 65, "7. Execution Phase", "multi_replace, commands, browser subagent", strokeColor="#1971c2", bgColor="#e7f5ff", textColor="#1864ab")
    
    # 8. Verification
    add_arrow(elements, 600, 785, 600, 820)
    add_box(elements, 460, 820, 280, 65, "8. Verification & Testing", "Run tests, build validation, checks", strokeColor="#0ca678", bgColor="#e6fcf5", textColor="#099268")
    
    # 9. Walkthrough & Delivery
    add_arrow(elements, 600, 885, 600, 920)
    add_box(elements, 460, 920, 280, 65, "9. Walkthrough & Response", "walkthrough.md + links + evidence", strokeColor="#0ca678", bgColor="#e6fcf5", textColor="#099268")
    
    # Final Join
    add_arrow(elements, 165, 870, 460, 950)
    
    excalidraw_data = {
        "type": "excalidraw",
        "version": 2,
        "source": "https://excalidraw.com",
        "elements": elements,
        "appState": {
            "gridSize": None,
            "viewBackgroundColor": "#ffffff"
        },
        "files": {}
    }
    return excalidraw_data

if __name__ == "__main__":
    data = build_excalidraw_flow()
    with open("/Users/rentconnected/Real-Bot-Repo/agent_workflow.excalidraw", "w") as f:
        json.dump(data, f, indent=2)
    print("Successfully generated agent_workflow.excalidraw")
