import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Cart from './pages/Cart';
import PaymentResult from './pages/PaymentResult';
import StudyRoom from './pages/StudyRoom';
import BecomeInstructor from './pages/BecomeInstructor';
import MyCourses from './pages/instructor/MyCourses';
import CreateCourse from './pages/instructor/CreateCourse';
import EditCourse from './pages/instructor/EditCourse';
import ProtectedRoute from './components/ProtectedRoute';
import MyLearning from './pages/MyLearning';
import OrderHistory from './pages/OrderHistory';
import InstructorLayout from './components/InstructorLayout';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseReview from './pages/admin/AdminCourseReview';
import AdminInstructorRequests from './pages/admin/AdminInstructorRequests';
import AdminRefunds from './pages/admin/AdminRefunds';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminCategories from './pages/admin/AdminCategories';
import AdminUsers from './pages/admin/AdminUsers';
import Wishlist from './pages/Wishlist';
import ProfileSettings from './pages/ProfileSettings';

/* Layout: Navbar + page */
function WithNavbar() {
  return (
    <>
      <Navbar />
      <div className="pt-4">
        <Outlet />
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{ style: { borderRadius: '12px', fontWeight: 500 } }}
          />

          <div className="font-sans text-slate-900 bg-slate-50 min-h-screen">
            <Routes>

              {/* ── Group 1: Auth pages — KHÔNG có Navbar (full-screen auth) ── */}
              <Route path="/login"           element={<Login />} />
              <Route path="/register"        element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* ── Group 2: Public pages — CÓ Navbar ──────────────────────── */}
              <Route element={<WithNavbar />}>
                <Route path="/"                     element={<Home />} />
                <Route path="/courses"              element={<Courses />} />
                <Route path="/courses/:id"          element={<CourseDetail />} />
                <Route path="/payment/result"       element={<PaymentResult />} />
              </Route>

              {/* ── Group 3: Routes CẦN ĐĂNG NHẬP ─────────────────────────── */}
              <Route element={<ProtectedRoute />}>
                <Route element={<WithNavbar />}>
                  <Route path="/cart"                      element={<Cart />} />
                  <Route path="/become-instructor"         element={<BecomeInstructor />} />
                  <Route path="/my-learning"               element={<MyLearning />} />
                  <Route path="/my-orders"                 element={<OrderHistory />} />
                  <Route path="/wishlist"                  element={<Wishlist />} />
                  <Route path="/settings"                  element={<ProfileSettings />} />
                </Route>

                {/* Sub-layout dành cho Instructor */}
                <Route path="/instructor" element={<InstructorLayout />}>
                  <Route index element={<InstructorDashboard />} />
                  <Route path="courses" element={<MyCourses />} />
                  <Route path="courses/create" element={<CreateCourse />} />
                  <Route path="courses/:id/edit" element={<EditCourse />} />
                </Route>
                {/* Layout riêng, KHÔNG có Navbar */}
                <Route path="/learning/:courseId" element={<StudyRoom />} />
              </Route>

              {/* ── Group 4: Admin ──────────────────────────────────────────── */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index                       element={<AdminDashboard />} />
                <Route path="courses"              element={<AdminCourses />} />
                <Route path="courses/:id/review"   element={<AdminCourseReview />} />
                <Route path="instructor-requests"  element={<AdminInstructorRequests />} />
                <Route path="refunds"              element={<AdminRefunds />} />
                <Route path="coupons"              element={<AdminCoupons />} />
                <Route path="categories"           element={<AdminCategories />} />
                <Route path="users"                element={<AdminUsers />} />
              </Route>

              {/* ── 404 ────────────────────────────────────────────────────── */}
              <Route path="*" element={
                <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-400">
                  <p className="text-7xl font-black text-slate-200">404</p>
                  <p className="text-lg font-semibold">Trang không tồn tại</p>
                  <a href="/" className="mt-2 text-violet-600 hover:text-violet-800 font-bold underline">
                    Về trang chủ
                  </a>
                </div>
              } />

            </Routes>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;