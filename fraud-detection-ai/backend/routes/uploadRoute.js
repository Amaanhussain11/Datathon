import { Router } from 'express';
import multer from 'multer';
import { handleCSVUpload } from '../controllers/csvController.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), handleCSVUpload);

export default router;
