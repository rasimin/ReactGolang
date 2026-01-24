-- Script untuk Generate 1000 Data Dummy Users
-- Copy script ini dan jalankan di SQL Server Management Studio (SSMS)

USE [react_pertama]; -- Ganti dengan nama database Anda jika berbeda
GO

SET NOCOUNT ON;

DECLARE @i INT = 1;
DECLARE @TotalRows INT = 1000; -- Jumlah data yang ingin dibuat
DECLARE @BatchSize INT = 100;  -- Commit setiap 100 baris agar log tidak penuh

BEGIN TRANSACTION;

WHILE @i <= @TotalRows
BEGIN
    INSERT INTO Users (
        Email, 
        Password, 
        Name, 
        Role, 
        IsActive, 
        CreatedAt, 
        FailedLoginAttempts
    )
    VALUES (
        'user' + CAST(@i AS NVARCHAR(20)) + '@example.com',
        'password123', -- Password plain text (akan otomatis di-hash saat login pertama kali)
        'User Dummy ' + CAST(@i AS NVARCHAR(20)),
        CASE WHEN @i % 50 = 0 THEN 'admin' ELSE 'user' END, -- Setiap user ke-50 jadi admin
        1, -- IsActive: True
        DATEADD(day, -(@TotalRows - @i), GETDATE()), -- CreatedAt: mundur ke belakang agar variatif
        0
    );

    -- Print progress setiap 100 data
    IF @i % 100 = 0
    BEGIN
        PRINT 'Inserted ' + CAST(@i AS NVARCHAR(20)) + ' rows...';
    END

    SET @i = @i + 1;
END;

COMMIT TRANSACTION;

PRINT 'Selesai! ' + CAST(@TotalRows AS NVARCHAR(20)) + ' data user telah ditambahkan.';
GO
