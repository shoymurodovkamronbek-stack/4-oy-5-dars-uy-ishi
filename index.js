const BASE_URL = "https://look-njzu.onrender.com";
let users = [];
let selectedUserId = null;
const customersList = document.querySelector(".customers-list");
const userAddForm = document.getElementById("userAdd");
const usernameInput = document.getElementById("usernameInput");
const telephoneInput = document.getElementById("telephoneInput");

const clientId = document.getElementById("clientId");
const userHeader = document.getElementById("userHeader");
const ordersList = document.querySelector(".orders-list");

const foodsForm = document.getElementById("foodsForm");
const foodsSelect = document.getElementById("foodsSelect");
const foodsCount = document.getElementById("foodsCount");

// API
async function request(url, options = {}) {
    const response = await fetch(BASE_URL + url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Xatolik yuz berdi");
    }

    return data;
}

// ovqatlarni chiqarish
async function loadFoods() {
    try {
        const result = await request("/foods");
        const foods = result.data || result;

        foodsSelect.innerHTML = "";

        foods.forEach(food => {
            const option = document.createElement("option");
            option.value = food.foodId;
            option.textContent = food.food_name;
            foodsSelect.appendChild(option);
        });
    } catch (error) {
        console.log(error.message);
    }
}

// mijozlarni chiqarish
function showUsers() {
    customersList.innerHTML = "";

    users.forEach(user => {
        const li = document.createElement("li");
        li.className = "customer-item";

        const id = user.userId ?? user.id ?? user._id;
        li.textContent = `${user.username} - ${user.telephone}`;

        if (String(id) === String(selectedUserId)) {
            li.classList.add("active");
        }

        li.addEventListener("click", () => {
            selectedUserId = id;
            showUsers();
            showOrders();
        });

        customersList.appendChild(li);
    });
}

// mijozlarni yuklash
async function loadUsers() {
    try {
        const result = await request("/users");
        users = result.data || result;

        if (users.length > 0) {
            const user = users.find(user =>
                String(user.userId ?? user.id ?? user._id) ===
                String(selectedUserId)
            );

            if (!user) {
                selectedUserId =
                    users[0].userId ?? users[0].id ?? users[0]._id;
            }
        }

        showUsers();
        await showOrders();
    } catch (error) {
        console.log(error.message);
    }
}

// tanlagan mijoz zakazlari
async function showOrders() {
    const user = users.find(user =>
        String(user.userId ?? user.id ?? user._id) ===
        String(selectedUserId)
    );

    ordersList.innerHTML = "";

    if (!user) {
        clientId.textContent = "";
        userHeader.textContent = "Mijoz tanlanmagan";
        return;
    }

    clientId.textContent = selectedUserId;
    userHeader.textContent = user.username;

    try {
        const result = await request("/orders/" + selectedUserId);
        const orders = result.data || result;

        if (selectedUserId !== (user.userId ?? user.id ?? user._id)) {
            return;
        }

        if (!orders.length) {
            ordersList.textContent = "Buyurtmalar yo'q";
            return;
        }

        orders.forEach(order => {
            const food = order.foods?.[0];

            const li = document.createElement("li");
            li.className = "order-item";

            const img = document.createElement("img");
            img.alt = food?.food_name || "Ovqat";

            if (food?.food_img) {
                img.src = food.food_img.startsWith("http")
                    ? food.food_img
                    : BASE_URL + food.food_img;
            } else {
                img.src = BASE_URL + "/files/cola.jpeg";
            }

            const details = document.createElement("div");

            const name = document.createElement("span");
            name.className = "order-name";
            name.textContent = food?.food_name || "Noma'lum mahsulot";

            const count = document.createElement("span");
            count.className = "order-count";
            count.textContent = order.count ?? 0;

            details.append(name, count);
            li.append(img, details);
            ordersList.appendChild(li);
        });
    } catch (error) {
        ordersList.textContent = "Buyurtmalarni yuklab bo'lmadi";
        console.log(error.message);
    }
}

// yangi mijoz qoshish
userAddForm.addEventListener("submit", async event => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const telephone = telephoneInput.value.trim();

    if (!username || !telephone) {
        alert("Ism va telefon raqamini kiriting!");
        return;
    }

    try {
        await request("/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, telephone })
        });

        userAddForm.reset();
        await loadUsers();
    } catch (error) {
        alert("Mijoz qo'shilmadi: " + error.message);
    }
});

// zakaz berish
foodsForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (selectedUserId === null) {
        alert("Avval mijozni tanlang!");
        return;
    }

    const foodId = Number(foodsSelect.value);
    const count = Number(foodsCount.value);

    if (!Number.isInteger(count) || count < 1) {
        alert("Miqdorni to'g'ri kiriting!");
        return;
    }

    if (count > 10) {
        alert("Bir buyurtmada maksimal 10 ta mahsulot olish mumkin!");
        return;
    }

    try {
        await request("/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: Number(selectedUserId),
                foodId,
                count
            })
        });

        foodsCount.value = "";
        await showOrders();
    } catch (error) {
        alert("Buyurtma qo'shilmadi: " + error.message);
    }
});

loadFoods();
loadUsers();
