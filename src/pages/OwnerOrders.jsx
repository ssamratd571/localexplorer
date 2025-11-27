// src/pages/OwnerOrders.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../services/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";

export default function OwnerOrders() {
  const [hotelOrders, setHotelOrders] = useState([]);
  const [carOrders, setCarOrders] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  const [shoppingOrders, setShoppingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // HOTEL – ownerUid from Hotels.jsx
      unsubHotel = onSnapshot(
        query(collection(db, "hotelBookings"), where("ownerUid", "==", user.uid)),
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

      // CAR – ownerUid from Cars.jsx
      unsubCar = onSnapshot(
        query(collection(db, "bookings"), where("ownerUid", "==", user.uid)),
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

      // CUISINE – ownerUid from Cuisine.jsx
      unsubFood = onSnapshot(
        query(collection(db, "orders"), where("ownerUid", "==", user.uid)),
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

      // SHOPPING – ownerUid from shopping order creation
      unsubShopping = onSnapshot(
        query(
          collection(db, "shoppingOrders"),
          where("ownerUid", "==", user.uid)
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

  const allOrders = [...hotelOrders, ...carOrders, ...foodOrders, ...shoppingOrders].sort(
    (a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    }
  );

  const statusColor = (s) => {
    if (s === "approved") return "text-green-300";
    if (s === "rejected" || s === "cancelled") return "text-red-300";
    return "text-yellow-300";
  };

  const getCollectionName = (order) => {
    if (order.type === "hotel") return "hotelBookings";
    if (order.type === "car") return "bookings";
    if (order.type === "cuisine") return "orders";
    if (order.type === "shopping") return "shoppingOrders";
    return "orders";
  };

  const updateStatus = async (order, newStatus) => {
    try {
      await updateDoc(doc(db, getCollectionName(order), order.id), {
        status: newStatus,
      });
      alert(`Order ${newStatus}.`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-700 to-blue-700 text-white p-6">
        Loading owner orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-emerald-700 to-blue-700 text-white">
      <h1 className="text-3xl font-bold mb-6">Owner Order Requests</h1>

      {allOrders.length === 0 ? (
        <p>No incoming requests.</p>
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

              {/* DETAILS BY TYPE */}
              <div className="text-sm space-y-1">
                {o.type === "hotel" && (
                  <>
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
                    <p>User ID: {o.userId}</p>
                    {o.userEmail && <p>User Email: {o.userEmail}</p>}
                  </>
                )}

                {o.type === "car" && (
                  <>
                    <p>Car: {o.carName}</p>
                    {o.orgName && <p>Partner: {o.orgName}</p>}
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
                    {o.message && <p>User note: {o.message}</p>}
                    <p>User ID: {o.userUid}</p>
                  </>
                )}

                {o.type === "cuisine" && (
                  <>
                    <p>Restaurant: {o.restaurantName}</p>
                    <p>
                      Dish: {o.dishName} ({o.variant})
                    </p>
                    <p>Quantity: {o.quantity}</p>
                    <p>Price/plate: ₹{o.unitPrice}</p>
                    <p>Total: ₹{o.totalAmount}</p>
                    {o.note && <p>User note: {o.note}</p>}
                    <p>User ID: {o.userUid}</p>
                    {o.userName && <p>User: {o.userName}</p>}
                  </>
                )}

                {o.type === "shopping" && (
                  <>
                    <p>Product: {o.name}</p>
                    {o.category && <p>Category: {o.category}</p>}
                    <p>Price: ₹{o.price}</p>
                    {o.quantity && <p>Quantity: {o.quantity}</p>}
                    {o.totalAmount && <p>Total: ₹{o.totalAmount}</p>}
                    {o.description && <p>Details: {o.description}</p>}
                    <p>User ID: {o.userUid}</p>
                    {o.userName && <p>User: {o.userName}</p>}
                  </>
                )}

                {o.createdAt && (
                  <p className="text-xs text-white/60 mt-2">
                    Requested at:{" "}
                    {new Date(o.createdAt.seconds * 1000).toLocaleString()}
                  </p>
                )}
              </div>

              {/* ACTION BUTTONS */}
              {(!o.status || o.status === "pending") && (
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => updateStatus(o, "approved")}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(o, "rejected")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



