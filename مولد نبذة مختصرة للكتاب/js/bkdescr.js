import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = 'AIzaSyDWapAxJa4oZ656INHWdv3vmIkjMkM6vCw';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let ocrCompleted = false;
const ocrApiKey = 'K83037240588957'; // استبدل هذا بمفتاح OCR.space API الخاص بك

window.handleFileUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('fileName').textContent = file.name;
        processImage(file);
    }
};

// دالة لعرض نافذة التأكيد عند الضغط على زر رفع الصورة
window.handleUploadClick = function(event) {
    event.preventDefault(); // منع السلوك الافتراضي للنقر على العلامة
    showConfirmationModal();
};

// دالة لإظهار نافذة التأكيد
function showConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'block';
}

// دالة لإغلاق نافذة التأكيد
window.closeModal = function() {
    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'none';
};

// دالة للتأكيد على رفع الصورة
window.confirmUpload = function() {
    closeModal();
    // فتح نافذة اختيار الملف
    document.getElementById('tocImage').click();
};

window.generateTexts = async function() {
    const bookName = document.getElementById('bookName').value.trim();
    const authorName = document.getElementById('authorName').value.trim();
    const toc = document.getElementById('toc').value.trim();

    if (!bookName || !authorName || (!toc && !ocrCompleted)) {
        showNotification("يرجى إدخال جميع الحقول المطلوبة!", 'error');
        return;
    }

    try {
        updateProgress(0.3);
        document.getElementById('summary').innerText = "جاري توليد النبذة...";
        document.getElementById('resultSection').style.display = 'block';

        const prompt = `اكتب نبذة مختصرة جدًا عن الكتاب بعنوان "${bookName}" الذي ألفه "${authorName}". النبذة يجب أن تكون موجزة وتقدم فكرة عامة فقط عن محتوى الكتاب دون التطرق إلى تفاصيل كل موضوع.\n جدول المحتويات:\n${toc}`;

        const result = await model.generateContent(prompt);
        updateProgress(0.7);

        if (result && result.response) {
            const generatedText = await result.response.text();
            document.getElementById('summary').innerText = generatedText;
            updateProgress(1);
            setTimeout(() => updateProgress(0), 1000);
            showNotification('تم توليد النبذة بنجاح.', 'success');
        } else {
            throw new Error("لم يتم استلام رد من API.");
        }
    } catch (error) {
        console.error("خطأ أثناء توليد النبذة:", error);
        showNotification('حدث خطأ أثناء توليد النبذة. يرجى المحاولة مرة أخرى لاحقًا.', 'error');
        updateProgress(0);
    }
};

async function processImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apikey', ocrApiKey);
    formData.append('language', 'ara');
    formData.append('isOverlayRequired', 'false');

    try {
        updateProgress(0.2);
        showNotification('جاري معالجة الصورة...', 'info');
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        updateProgress(0.8);

        if (result.ParsedResults && result.ParsedResults.length > 0) {
            const extractedText = result.ParsedResults[0].ParsedText;
            document.getElementById('toc').value = extractedText;
            ocrCompleted = true;
            updateProgress(1);
            setTimeout(() => updateProgress(0), 1000);
            showNotification('تم استخراج النص من الصورة بنجاح.', 'success');
        } else {
            throw new Error('فشل في استخراج النص من الصورة.');
        }
    } catch (error) {
        console.error("خطأ في معالجة الصورة:", error);
        showNotification("حدث خطأ أثناء معالجة الصورة. يرجى المحاولة مرة أخرى.", 'error');
        updateProgress(0);
    }
}

function updateProgress(value) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${value * 100}%`;
}

// دالة لنسخ النص
window.copySummary = function() {
    const summaryText = document.getElementById('summary').innerText;
    if (!summaryText) {
        showNotification("لا يوجد نص لنسخه.", 'error');
        return;
    }

    navigator.clipboard.writeText(summaryText).then(() => {
        showNotification("تم نسخ النص بنجاح!", 'success');
    }).catch(err => {
        console.error("فشل في نسخ النص:", err);
        showNotification("حدث خطأ أثناء نسخ النص.", 'error');
    });
};

// دوال لإظهار رسائل التنبيه
function showNotification(message, type) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.classList.add('notification', type, 'show');
    notification.innerHTML = `${message}`;

    // إضافة أيقونة بناءً على نوع الرسالة
    const icon = document.createElement('i');
    if (type === 'success') {
        icon.classList.add('fas', 'fa-check-circle');
    } else if (type === 'error') {
        icon.classList.add('fas', 'fa-exclamation-circle');
    } else {
        icon.classList.add('fas', 'fa-info-circle');
    }
    notification.appendChild(icon);

    container.appendChild(notification);

    // إزالة الرسالة بعد 3 ثوانٍ
    setTimeout(() => {
        notification.classList.remove('show');
        // إزالة العنصر بعد انتهاء الانتقال
        notification.addEventListener('transitionend', () => {
            notification.remove();
        });
    }, 3000);
}
