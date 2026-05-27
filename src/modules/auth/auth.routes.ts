import { Router } from 'express';
import {
    register, login, listUsers, listallUsers, updateUser,
    deleteUser, changePasswordwithotpverfiedperson, changePassword, updateProfile, getUserProfile
} from './auth.controller';
import { protect } from '../../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get("/users", protect, listUsers);
router.get("/list-all", protect, listallUsers);
router.put("/update-profile", protect, updateProfile);
router.get("/profile", protect, getUserProfile);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);

router.post("/changenewpasswordvialogin", protect, changePassword);
router.post("/changenewpassword", changePasswordwithotpverfiedperson);


export default router;
