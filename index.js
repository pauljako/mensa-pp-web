const HOST = "http://localhost:32339"

const COLORS = ["gold", "orange", "PowderBlue"]

async function login(user_id, password) {
    let response = await fetch(`${HOST}/api/login`, {
        body: new URLSearchParams({
            id: user_id,
            password: password
        }),
        method: "POST"
    });

    if (!response.ok) return undefined

    return (await response.json())["session_id"]
}

async function prompt_login() {
    let user_id = prompt("Enter User-Id")
    let password = prompt("Enter Password")
    return await login(user_id, password)
}

async function fetch_menu(session_id) {
    let response = await fetch(`${HOST}/api/menu`, {
        headers: {
            "Session-Id": session_id
        }
    })

    if (!response.ok) return undefined

    return await response.json()
}

async function order_meal(session_id, meal_id) {
    let response = await fetch(`${HOST}/api/order`, {
        headers: {
            "Session-Id": session_id,
            "Meal-Id": meal_id
        },
        method: "POST"
    })

    return response.ok
}

async function cancel_meal(session_id, meal_id) {
    let response = await fetch(`${HOST}/api/cancel`, {
        headers: {
            "Session-Id": session_id,
            "Meal-Id": meal_id
        },
        method: "DELETE"
    })

    return response.ok
}

async function fill_menu(session_id) {
    const menus = await fetch_menu(session_id)

    for (const element of document.getElementsByClassName("menu_row")) {
        element.remove();
    }

    let table = document.getElementById("menu")

    table.innerHTML = `<tr>
    <th class="menu_item menu_header">Menu</th>
    <th class="menu_item menu_header">Monday</th>
    <th class="menu_item menu_header">Tuesday</th>
    <th class="menu_item menu_header">Wednesday</th>
    <th class="menu_item menu_header">Thursday</th>
    <th class="menu_item menu_header">Friday</th>
    </tr>`

    for (const [menu_id, meals] of Object.entries(menus)) {
        let table_row = document.createElement("tr")
        table_row.className = "menu_row"
        let menu_name = document.createElement("th")
        menu_name.style.borderColor = (COLORS[menu_id] === undefined ? "black" : COLORS[menu_id])
        menu_name.className = "menu_name menu_item"
        menu_name.innerText = `Menu ${parseInt(menu_id) + 1}`
        table_row.append(menu_name)
        for (const meal of meals) {
            let table_meal = document.createElement("td")
            table_meal.className = "menu_item"
            table_meal.style.borderColor = (COLORS[menu_id] === undefined ? "black" : COLORS[menu_id])
            if (meal == null) {
                table_meal.innerHTML = "<i>No food available</i>"
            } else {
                table_meal.innerText = meal["name"].join(", ")
                table_meal.append(document.createElement("br"))
                let price_text = document.createElement("i")
                price_text.innerHTML = `${meal["state"]} &CenterDot; ${meal["price"]}`
                table_meal.append(price_text)

                if (meal["state"] === "available") {
                    table_meal.onclick = () => {
                        order_meal(session_id, meal["meal_id"]).then(() => fill_menu(session_id))
                    }
                    table_meal.title = "Click to order"
                } else if (meal["state"] === "ordered") {
                    table_meal.onclick = () => {
                        cancel_meal(session_id, meal["meal_id"]).then(() => fill_menu(session_id))
                    }
                    table_meal.title = "Click to cancel order"
                }
            }
            table_row.append(table_meal)
        }

        table.append(table_row)
    }
}

prompt_login().then((session_id) => {
    if (session_id === undefined) {
        alert("An error occurred")
    } else {
        fill_menu(session_id)
    }
})