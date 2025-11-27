// src/router.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";  

import Hotels from "./pages/Hotels";
import AdminUploadOptions from "./pages/AdminUploadOptions";
import UploadHome from "./pages/admin/UploadHome";
import AddHotel from "./pages/admin/AddHotel";

import Weather from "./pages/Weather";
import Tourist from "./pages/Tourist";
import ELearning from "./pages/ELearning";
import Support from "./pages/Support";
import Cars from "./pages/Cars";
import AddCar from "./pages/admin/AddCar";
import AddCuisine from "./pages/admin/AddCuisine";
import AddShopping from "./pages/admin/AddShopping";
import Cuisine from "./pages/Cuisine";
import Shopping from "./pages/Shopping";
import Agriculture from "./pages/Agriculture";
import OwnerChats from "./pages/OwnerChats";
import OwnerShoppingChats from "./pages/OwnerShoppingChats";
import OwnerHotelChats from "./pages/OwnerHotelChats";
import OwnerCarChats from "./pages/OwnerCarChats";
import MyOrders from "./pages/MyOrders";
import OwnerOrders from "./pages/OwnerOrders";





export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />  {/* ✅ add this */}
       
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/admin/upload-options" element={<AdminUploadOptions />} />
        <Route path="/dashboard/upload" element={<UploadHome />} />
        <Route path="/dashboard/upload/hotel" element={<AddHotel/>}/>

        <Route path="/weather" element={<Weather />} />
        <Route path="/tourist" element={<Tourist />} />
        <Route path="/elearning" element={<ELearning />} />
        <Route path="/support" element={<Support />} />
        <Route path="/dashboard/cars/add" element={<AddCar />} />


        <Route path="/dashboard/cars" element={<Cars />} />
        <Route path="/dashboard/cuisine/add" element={<AddCuisine />} />
        <Route path="/dashboard/shopping/add" element={<AddShopping />} />
        <Route path="/cuisine" element={<Cuisine />} />
        <Route path="/shopping" element={<Shopping />} />
        <Route path="/agriculture" element={<Agriculture />} />
        <Route path="/owner-chats" element={<OwnerChats />} />
        <Route path="/owner-shopping-chats" element={<OwnerShoppingChats />} />
        <Route path="/owner-hotel-chats" element={<OwnerHotelChats />} />
        <Route path="/owner-car-chats" element={<OwnerCarChats />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/owner-orders" element={<OwnerOrders />} />



      </Routes>
    </Router>
  );
}





