import bcrypt from 'bcryptjs';

import prisma from '../src/lib/prisma.js';

async function main() {
 console.log('Veritabanı bağlantısı kontrol ediliyor...');
 await prisma.$connect();

 const passwordHash = await bcrypt.hash('123456', 10);

 // 1. Türkçe Kullanıcılar
 console.log('Kullanıcılar oluşturuluyor...');
 
 // Teachers
 const teacher1 = await prisma.user.upsert({
 where: { email: 'ahmet.yilmaz@smartedu.com' },
 update: {},
 create: {
 name: 'Ahmet Yılmaz',
 email: 'ahmet.yilmaz@smartedu.com',
 passwordHash,
 role: 'teacher',
 isActive: true
 }
 });

 const teacher2 = await prisma.user.upsert({
 where: { email: 'ayse.kaya@smartedu.com' },
 update: {},
 create: {
 name: 'Ayşe Kaya',
 email: 'ayse.kaya@smartedu.com',
 passwordHash,
 role: 'teacher',
 isActive: true
 }
 });

 const teacher3 = await prisma.user.upsert({
 where: { email: 'can.turan@smartedu.com' },
 update: {},
 create: {
 name: 'Can Turan',
 email: 'can.turan@smartedu.com',
 passwordHash,
 role: 'teacher',
 isActive: true
 }
 });

 // Students
 const student1 = await prisma.user.upsert({
 where: { email: 'mehmet.demir@ogrenci.edu' },
 update: {},
 create: {
 name: 'Mehmet Demir',
 email: 'mehmet.demir@ogrenci.edu',
 passwordHash,
 role: 'student',
 isActive: true
 }
 });

 const student2 = await prisma.user.upsert({
 where: { email: 'zeynep.celik@ogrenci.edu' },
 update: {},
 create: {
 name: 'Zeynep Çelik',
 email: 'zeynep.celik@ogrenci.edu',
 passwordHash,
 role: 'student',
 isActive: true
 }
 });

 const student3 = await prisma.user.upsert({
 where: { email: 'mustafa.yildiz@ogrenci.edu' },
 update: {},
 create: {
 name: 'Mustafa Yıldız',
 email: 'mustafa.yildiz@ogrenci.edu',
 passwordHash,
 role: 'student',
 isActive: true
 }
 });

 const student4 = await prisma.user.upsert({
 where: { email: 'elif.sahin@ogrenci.edu' },
 update: {},
 create: {
 name: 'Elif Şahin',
 email: 'elif.sahin@ogrenci.edu',
 passwordHash,
 role: 'student',
 isActive: true
 }
 });

 // 2. Türkçe Dersler
 console.log('Dersler oluşturuluyor...');
 
 const course1 = await prisma.course.upsert({
 where: { code: 'MAT101' },
 update: {},
 create: {
 title: 'İleri Matematik',
 description: 'Türev, integral ve limit konularının detaylı analizi. Öğrenciler haftalık ödevlerle değerlendirilecektir.',
 subject: 'Matematik',
 code: 'MAT101',
 teacherId: teacher1.id
 }
 });

 const course2 = await prisma.course.upsert({
 where: { code: 'FIZ102' },
 update: {},
 create: {
 title: 'Genel Fizik I',
 description: 'Mekanik, Newton un hareket yasaları ve enerji korunumu üzerine temel fizik kavramları.',
 subject: 'Fizik',
 code: 'FIZ102',
 teacherId: teacher2.id
 }
 });

 const course3 = await prisma.course.upsert({
 where: { code: 'BIL201' },
 update: {},
 create: {
 title: 'Veri Yapıları ve Algoritmalar',
 description: 'Ağaçlar, graflar, sıralama ve arama algoritmaları üzerine kapsamlı projeler.',
 subject: 'Bilgisayar Bilimleri',
 code: 'BIL201',
 teacherId: teacher3.id
 }
 });

 const course4 = await prisma.course.upsert({
 where: { code: 'YAZ301' },
 update: {},
 create: {
 title: 'Yazılım Mühendisliği',
 description: 'Çevik yazılım geliştirme süreçleri, tasarım kalıpları ve mimari yaklaşımlar.',
 subject: 'Yazılım',
 code: 'YAZ301',
 teacherId: teacher1.id
 }
 });

 const course5 = await prisma.course.upsert({
 where: { code: 'MAT201' },
 update: {},
 create: {
 title: 'Matris Teorisi ve Lineer Cebir',
 description: 'Determinant, Vektör uzayları ve matris işlemleri incelenenecektir.',
 subject: 'Matematik',
 code: 'MAT201',
 teacherId: teacher2.id
 }
 });

 const course6 = await prisma.course.upsert({
 where: { code: 'EDBI10' },
 update: {},
 create: {
 title: 'Türk Dili ve Edebiyatı',
 description: 'Türk kültür tarihi ışığı altında yazılı metinlerin incelenmesi.',
 subject: 'Edebiyat',
 code: 'EDBI10',
 teacherId: teacher3.id
 }
 });

 // 3. Öğrenci Kayıtları
 console.log('Öğrenciler derslere kaydediliyor...');
 const enrollments = [
 { courseId: course1.id, studentId: student1.id },
 { courseId: course1.id, studentId: student2.id },
 { courseId: course1.id, studentId: student3.id },
 { courseId: course1.id, studentId: student4.id },
 { courseId: course2.id, studentId: student1.id },
 { courseId: course2.id, studentId: student4.id },
 { courseId: course3.id, studentId: student2.id },
 { courseId: course3.id, studentId: student3.id },
 { courseId: course3.id, studentId: student4.id },
 { courseId: course4.id, studentId: student1.id },
 { courseId: course4.id, studentId: student3.id },
 { courseId: course4.id, studentId: student2.id },
 { courseId: course4.id, studentId: student4.id },
 { courseId: course5.id, studentId: student1.id },
 { courseId: course6.id, studentId: student4.id },
 ];

 for (const en of enrollments) {
 await prisma.enrollment.upsert({
 where: { courseId_studentId: { courseId: en.courseId, studentId: en.studentId } },
 update: {},
 create: { courseId: en.courseId, studentId: en.studentId, status: 'active' }
 });
 }

 // 4. Ödevler
 console.log('Gerçekçi ödevler ekleniyor...');
 
 const assignment1 = await prisma.assignment.create({
 data: {
 courseId: course1.id,
 title: 'Türev Uygulamaları',
 description: 'Ders kitabındaki Bölüm 4 sonu sorularından 15 ile 30 arasındakileri çözüp sisteme PDF olarak yükleyiniz. Çözümlerinizin okunaklı olmasına dikkat edin.',
 dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
 maxScore: 100,
 createdById: teacher1.id,
 status: 'published'
 }
 });

 const assignment2 = await prisma.assignment.create({
 data: {
 courseId: course1.id,
 title: 'İntegral ve Alan Hesaplama',
 description: 'Verilen eğriler altında kalan alanları Riemann Toplamı mantığıyla hesaplayınız. Örnek çizim ektedir.',
 dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
 maxScore: 100,
 createdById: teacher1.id,
 status: 'published'
 }
 });

 const assignment3 = await prisma.assignment.create({
 data: {
 courseId: course2.id,
 title: 'Bağıl Hareket Raporu',
 description: 'Laboratuvarda yapılan bağıl hareket deneyinin raporunu hazırlayınız. Hata paylarını eklemeyi unutmayın.',
 dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue for testing)
 maxScore: 100,
 createdById: teacher2.id,
 status: 'published'
 }
 });

 const assignment4 = await prisma.assignment.create({
 data: {
 courseId: course3.id,
 title: 'Dijkstra Algoritması',
 description: 'Dijkstra en kısa yol algoritmasını kodlayıp GitHub deponuzun linkini gönderin.',
 dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
 maxScore: 100,
 createdById: teacher3.id,
 status: 'published'
 }
 });

 const assignment5 = await prisma.assignment.create({
 data: {
 courseId: course4.id,
 title: 'UML Şeması Tasarımı',
 description: 'Hayali bir E-ticaret sistemi için Use Case, Class ve Sequence diyagramlarını hazırlayın.',
 dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
 maxScore: 100,
 createdById: teacher1.id,
 status: 'published'
 }
 });

 const assignment6 = await prisma.assignment.create({
 data: {
 courseId: course4.id,
 title: 'Gereksinim Analizi ve SDLC',
 description: 'Çevik yöntemler (Agile) ile yapılacak bir mobil uygulama için temel ihtiyaçları dökümante ediniz.',
 dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
 maxScore: 100,
 createdById: teacher1.id,
 status: 'published'
 }
 });

 const assignment7 = await prisma.assignment.create({
 data: {
 courseId: course6.id,
 title: 'Dede Korkut Analiz Raporu',
 description: 'Dede korkut hikayelerindeki motivasyon ve kahramanlığın yerini tartışın.',
 dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
 maxScore: 100,
 createdById: teacher3.id,
 status: 'published'
 }
 });

 // 5. Teslimler
 console.log('Öğrenci teslimleri yapılıyor...');
 
 // Graded Submissions
 await prisma.submission.upsert({
 where: { assignmentId_studentId: { assignmentId: assignment1.id, studentId: student1.id } },
 update: {},
 create: {
 assignmentId: assignment1.id,
 studentId: student1.id,
 content: 'Hocam merhaba, 15 ile 30 arasındaki tüm soruları çözdüm. Çözümler ektedir. İyi çalışmalar dilerim. (turev_cevaplar_mehmet.pdf)',
 status: 'graded',
 grade: 95,
 feedback: 'İşlemlerin çok düzenli, sadece 22. soruda ufak bir hata var. Tebrikler.',
 submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
 }
 });

 await prisma.submission.upsert({
 where: { assignmentId_studentId: { assignmentId: assignment4.id, studentId: student2.id } },
 update: {},
 create: {
 assignmentId: assignment4.id,
 studentId: student2.id,
 content: 'GitHub Linkim: https://github.com/student2/dijkstra . Yorum satırlarını ekledim.',
 status: 'graded',
 grade: 100,
 feedback: 'Kod yapısı çok temiz, harika iş çıkarmışsın.',
 submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
 }
 });

 await prisma.submission.upsert({
 where: { assignmentId_studentId: { assignmentId: assignment6.id, studentId: student1.id } },
 update: {},
 create: {
 assignmentId: assignment6.id,
 studentId: student1.id,
 content: 'Analiz dökümanımı içeren PDF dosyasıdır.',
 status: 'graded',
 grade: 80,
 feedback: 'Use Case kısımlarına biraz daha çalışmanızı beklerdim.',
 submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
 }
 });

 // Pending Review Submissions (submitted but not graded)
 await prisma.submission.upsert({
 where: { assignmentId_studentId: { assignmentId: assignment1.id, studentId: student2.id } },
 update: {},
 create: {
 assignmentId: assignment1.id,
 studentId: student2.id,
 content: 'Dosyamı yüklüyorum, bazı sorularda zorlandım.',
 status: 'submitted',
 submittedAt: new Date()
 }
 });

 await prisma.submission.upsert({
 where: { assignmentId_studentId: { assignmentId: assignment5.id, studentId: student1.id } },
 update: {},
 create: {
 assignmentId: assignment5.id,
 studentId: student1.id,
 content: 'UML diyagramlarımı tamamlayıp PDF e dönüştürdüm. E-ticaret_Sistemi_UML.pdf',
 status: 'submitted',
 submittedAt: new Date()
 }
 });

 await prisma.submission.upsert({
 where: { assignmentId_studentId: { assignmentId: assignment3.id, studentId: student4.id } },
 update: {},
 create: {
 assignmentId: assignment3.id,
 studentId: student4.id,
 content: 'Hocam, rapor dosyasında grafiksel çıktıları belirttim.',
 status: 'submitted',
 submittedAt: new Date()
 }
 });


 console.log('Veritabanı GERÇEK VE TUTARLI Türkçe test verileri ile dolduruldu!');
 console.log('----------------------------------------------------');
 console.log('Örnek Öğretmenler: ahmet.yilmaz@smartedu.com, ayse.kaya@smartedu.com, can.turan@smartedu.com / Şifre: 123456');
 console.log('Örnek Öğrenciler: mehmet.demir@ogrenci.edu, zeynep.celik@ogrenci.edu, mustafa.yildiz@ogrenci.edu / Şifre: 123456');
}

main()
 .catch((error) => {
 console.error(error);
 process.exit(1);
 })
 .finally(async () => {
 await prisma.$disconnect();
 });