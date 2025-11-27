// src/pages/MyOrders.jsx
import { useEffect, useState, useRef } from "react";
import { auth, db } from "../services/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function MyOrders() {
  const [hotelOrders, setHotelOrders] = useState([]);
  const [carOrders, setCarOrders] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  const [shoppingOrders, setShoppingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const prevStatusesRef = useRef({});
  const initializedRef = useRef(false);

  useEffect(() => {
    let unsubHotel = null;
    let unsubCar = null;
    let unsubFood = null;
    let unsubShopping = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubHotel) unsubHotel();
      if (unsubCar) unsubCar();
      if (unsubFood) unsubFood();
      if (unsubShopping) unsubShopping();

      if (!user) {
        setHotelOrders([]);
        setCarOrders([]);
        setFoodOrders([]);
        setShoppingOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      // 🔹 HOTEL BOOKINGS – you save userId in Hotels.jsx
      unsubHotel = onSnapshot(
        query(collection(db, "hotelBookings"), where("userId", "==", user.uid)),
        (snap) => {
          setHotelOrders(
            snap.docs.map((d) => ({
              type: "hotel",
              id: d.id,
              ...d.data(),
            }))
          );
        }
      );

      // 🔹 CAR BOOKINGS – you save userUid in Cars.jsx
      unsubCar = onSnapshot(
        query(collection(db, "bookings"), where("userUid", "==", user.uid)),
        (snap) => {
          setCarOrders(
            snap.docs.map((d) => ({
              type: "car",
              id: d.id,
              ...d.data(),
            }))
          );
        }
      );

      // 🔹 CUISINE ORDERS – you save userUid in Cuisine.jsx
      unsubFood = onSnapshot(
        query(collection(db, "orders"), where("userUid", "==", user.uid)),
        (snap) => {
          setFoodOrders(
            snap.docs.map((d) => ({
              type: "cuisine",
              id: d.id,
              ...d.data(),
            }))
          );
        }
      );

      // 🔹 SHOPPING ORDERS – we designed to use userUid
      unsubShopping = onSnapshot(
        query(
          collection(db, "shoppingOrders"),
          where("userUid", "==", user.uid)
        ),
        (snap) => {
          setShoppingOrders(
            snap.docs.map((d) => ({
              type: "shopping",
              id: d.id,
              ...d.data(),
            }))
          );
        }
      );

      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubHotel) unsubHotel();
      if (unsubCar) unsubCar();
      if (unsubFood) unsubFood();
      if (unsubShopping) unsubShopping();
    };
  }, []);

  // Merge & sort by createdAt
  const allOrders = [...hotelOrders, ...carOrders, ...foodOrders, ...shoppingOrders].sort(
    (a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    }
  );

  // 🔔 Popup once when status changes to approved/rejected/cancelled
  useEffect(() => {
    if (!allOrders.length) return;

    if (!initializedRef.current) {
      const map = {};
      allOrders.forEach((o) => {
        const key = `${o.type}_${o.id}`;
        map[key] = o.status || "pending";
      });
      prevStatusesRef.current = map;
      initializedRef.current = true;
      return;
    }

    allOrders.forEach((o) => {
      const key = `${o.type}_${o.id}`;
      const prev = prevStatusesRef.current[key];
      const current = o.status || "pending";

      if (
        prev &&
        prev !== current &&
        (current === "approved" ||
          current === "rejected" ||
          current === "cancelled")
      ) {
        let msg = "";
        if (o.type === "hotel") {
          msg = `Your hotel booking for "${o.hotelTitle}" was ${current}.`;
        } else if (o.type === "car") {
          msg = `Your transport booking for "${o.carName}" was ${current}.`;
        } else if (o.type === "cuisine") {
          msg = `Your food order from "${o.restaurantName}" was ${current}.`;
        } else if (o.type === "shopping") {
          msg = `Your shopping order for "${o.name}" was ${current}.`;
        }
        alert(msg);
      }

      prevStatusesRef.current[key] = current;
    });
  }, [allOrders]);

  const statusColor = (s) => {
    if (s === "approved") return "text-green-300";
    if (s === "rejected" || s === "cancelled") return "text-red-300";
    return "text-yellow-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-6">
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {allOrders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {allOrders.map((o) => (
            <div
              key={o.id}
              className="bg-white/10 p-4 rounded-xl border border-white/20"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold capitalize">
                  {o.type === "hotel"
                    ? "🏨 Hotel Booking"
                    : o.type === "car"
                    ? "🚙 Transport Booking"
                    : o.type === "cuisine"
                    ? "🍽️ Food Order"
                    : "🛍️ Shopping Order"}
                </p>
                <p className={`font-semibold ${statusColor(o.status)}`}>
                  Status: {o.status || "pending"}
                </p>
              </div>

              {/* DETAILS PER TYPE */}
              {o.type === "hotel" && (
                <div className="text-sm space-y-1">
                  <p>Hotel: {o.hotelTitle}</p>
                  <p>City: {o.hotelCity}</p>
                  <p>
                    Dates: {o.checkIn} → {o.checkOut}
                  </p>
                  <p>
                    Room: {o.roomCategory} ({o.roomType})
                  </p>
                  <p>Guests: {o.guests}</p>
                  <p>Price/night: ₹{o.pricePerNight}</p>
                  <p>Total: ₹{o.totalPrice}</p>
                </div>
              )}

              {o.type === "car" && (
                <div className="text-sm space-y-1">
                  <p>Car: {o.carName}</p>
                  <p>Trip type: {o.tripType}</p>
                  <p>
                    Start: {o.startDate}
                    {o.endDate && ` | End: ${o.endDate}`}
                  </p>
                  <p>Pickup: {o.pickupLocation}</p>
                  {o.dropLocation && <p>Drop: {o.dropLocation}</p>}
                  <p>Pickup time: {o.pickupTime}</p>
                  <p>Passengers: {o.passengers}</p>
                  <p>
                    Category: {o.bookingVehicleType} – {o.bookingCategory}{" "}
                    {o.bookingVehicleType === "4-Wheeler" && o.bookingAcChoice
                      ? `(${o.bookingAcChoice})`
                      : null}
                  </p>
                  {o.perDayPrice && <p>Per day: ₹{o.perDayPrice}</p>}
                  {o.estimatedRent && (
                    <p>
                      Estimated rent ({o.tripDays} day
                      {o.tripDays > 1 ? "s" : ""}): ₹{o.estimatedRent}
                    </p>
                  )}
                  {o.message && <p>Note: {o.message}</p>}
                </div>
              )}

              {o.type === "cuisine" && (
                <div className="text-sm space-y-1">
                  <p>Restaurant: {o.restaurantName}</p>
                  <p>
                    Dish: {o.dishName} ({o.variant})
                  </p>
                  <p>Quantity: {o.quantity}</p>
                  <p>Price/plate: ₹{o.unitPrice}</p>
                  <p>Total: ₹{o.totalAmount}</p>
                  {o.note && <p>Note: {o.note}</p>}
                </div>
              )}

              {o.type === "shopping" && (
                <div className="text-sm space-y-1">
                  <p>Product: {o.name}</p>
                  {o.category && <p>Category: {o.category}</p>}
                  <p>Price: ₹{o.price}</p>
                  {o.quantity && <p>Quantity: {o.quantity}</p>}
                  {o.totalAmount && <p>Total: ₹{o.totalAmount}</p>}
                  {o.description && <p>Details: {o.description}</p>}
                  {o.ownerName && <p>Seller: {o.ownerName}</p>}
                  {o.ownerPhone && <p>Seller phone: {o.ownerPhone}</p>}
                </div>
              )}

              {o.createdAt && (
                <p className="text-xs text-white/60 mt-2">
                  Placed at:{" "}
                  {new Date(o.createdAt.seconds * 1000).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


