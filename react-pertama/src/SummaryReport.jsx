import config from './config.js';

const React = window.React;
const { useState, useMemo } = React;

export default function SummaryReport({ showToast }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            if (showToast) showToast("Please select a file first", "error");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        try {
            const response = await fetch(`${config.api.baseUrl}/api/upload-summary`, {
                method: "POST",
                headers: {
                    'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                },
                body: formData
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Upload failed");
            }

            const data = await response.json();
            setReportData(data);
            if (showToast) showToast("Report generated successfully", "success");
        } catch (error) {
            console.error(error);
            if (showToast) showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Scroll to detail date
    const scrollToDate = (dateStr) => {
        if (!dateStr) return;
        const safeId = `detail-date-${dateStr.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;
        const element = document.getElementById(safeId);
        const container = document.getElementById('detail-table-container');
        
        if (element && container) {
            // Calculate position relative to container
            // We need to find the relative top position of the element inside the container
            const headerOffset = 60; // Approximate height of the sticky header + some breathing room
            const elementTop = element.offsetTop;
            
            container.scrollTo({
                top: elementTop - headerOffset,
                behavior: 'smooth'
            });

            // Add temporary highlight
            element.classList.add('bg-warning', 'bg-opacity-25');
            setTimeout(() => {
                element.classList.remove('bg-warning', 'bg-opacity-25');
            }, 2000);
        }
    };

    // Calculate Stats
    const stats = useMemo(() => {
        if (!reportData) return null;
        
        const totalWeight = reportData.summary.reduce((acc, curr) => acc + curr.totalWeight, 0);
        // Count non-total rows
        const taskCount = reportData.detail.filter(r => r.taskName !== 'Total').length;
        // Count total days (based on summary rows which are per day)
        const totalDays = reportData.summary.length;
        
        // Find date range
        const dates = reportData.summary.map(r => new Date(r.finishDate));
        let dateRange = '-';
        if (dates.length > 0) {
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            // Format: DD MMM YYYY
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            if (minDate.getTime() === maxDate.getTime()) {
                dateRange = minDate.toLocaleDateString('en-GB', options);
            } else {
                dateRange = `${minDate.toLocaleDateString('en-GB', options)} - ${maxDate.toLocaleDateString('en-GB', options)}`;
            }
        }

        return { totalWeight, taskCount, totalDays, dateRange };
    }, [reportData]);

    return React.createElement('div', { className: 'animate-fade-in py-4 px-3' }, [
        // Header & Actions
        React.createElement('div', { key: 'top-bar', className: 'd-flex flex-wrap justify-content-between align-items-center mb-5' }, [
            React.createElement('div', { key: 'title-grp' }, [
                React.createElement('h4', { className: 'fw-bold mb-1' }, 'Summary Report'),
                React.createElement('p', { className: 'text-muted small mb-0 opacity-75' }, 'Upload and analyze your excel time reports')
            ]),
            
            // Upload Widget (Compact)
            React.createElement('div', { key: 'upload-widget', className: 'd-flex gap-2 align-items-center bg-modern-subtle p-2 rounded-3' }, [
                React.createElement('input', { 
                    key: 'file-input',
                    type: 'file', 
                    className: 'form-control form-control-sm border-0 bg-transparent file-input-modern', 
                    accept: '.xlsx, .xls',
                    style: { width: '250px' },
                    onChange: handleFileChange
                }),
                React.createElement('button', { 
                    key: 'upload-btn',
                    className: 'btn btn-primary btn-sm px-3 rounded-3 fw-bold', 
                    onClick: handleUpload,
                    disabled: loading
                }, loading ? [
                    React.createElement('span', { key: 'spin', className: 'spinner-border spinner-border-sm me-2' }),
                    'Processing'
                ] : [
                    React.createElement('i', { key: 'icon', className: 'fa-solid fa-cloud-arrow-up me-2' }),
                    'Process'
                ])
            ])
        ]),

        // Stats Cards (Only visible when data exists)
        reportData && stats && React.createElement('div', { key: 'stats-row', className: 'row g-3 mb-4 animate-fade-in' }, [
            // Card 1: Total Weight
            React.createElement('div', { key: 'stat-1', className: 'col-6 col-xl-3' },
                React.createElement('div', { className: 'modern-card p-3 h-100 d-flex align-items-center' }, [
                    React.createElement('div', { className: 'rounded-circle bg-primary bg-opacity-10 p-3 me-3 text-primary d-flex align-items-center justify-content-center flex-shrink-0', style: { width: '60px', height: '60px' } },
                        React.createElement('i', { className: 'fa-solid fa-weight-scale fa-lg' })
                    ),
                    React.createElement('div', {}, [
                        React.createElement('div', { className: 'small text-muted fw-bold opacity-75' }, 'TOTAL WEIGHT'),
                        React.createElement('h4', { className: 'mb-0 fw-bold' }, stats.totalWeight.toFixed(2))
                    ])
                ])
            ),
            // Card 2: Total Tasks
            React.createElement('div', { key: 'stat-2', className: 'col-6 col-xl-3' },
                React.createElement('div', { className: 'modern-card p-3 h-100 d-flex align-items-center' }, [
                    React.createElement('div', { className: 'rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success d-flex align-items-center justify-content-center flex-shrink-0', style: { width: '60px', height: '60px' } },
                        React.createElement('i', { className: 'fa-solid fa-list-check fa-lg' })
                    ),
                    React.createElement('div', {}, [
                        React.createElement('div', { className: 'small text-muted fw-bold opacity-75' }, 'TOTAL TASKS'),
                        React.createElement('h4', { className: 'mb-0 fw-bold' }, stats.taskCount)
                    ])
                ])
            ),
             // Card 3: Total Days
             React.createElement('div', { key: 'stat-3', className: 'col-6 col-xl-3' },
                React.createElement('div', { className: 'modern-card p-3 h-100 d-flex align-items-center' }, [
                    React.createElement('div', { className: 'rounded-circle bg-warning bg-opacity-10 p-3 me-3 text-warning d-flex align-items-center justify-content-center flex-shrink-0', style: { width: '60px', height: '60px' } },
                        React.createElement('i', { className: 'fa-solid fa-calendar-check fa-lg' })
                    ),
                    React.createElement('div', {}, [
                        React.createElement('div', { className: 'small text-muted fw-bold opacity-75' }, 'TOTAL DAYS'),
                        React.createElement('h4', { className: 'mb-0 fw-bold' }, stats.totalDays)
                    ])
                ])
            ),
            // Card 4: Period
            React.createElement('div', { key: 'stat-4', className: 'col-6 col-xl-3' },
                React.createElement('div', { className: 'modern-card p-3 h-100 d-flex align-items-center' }, [
                    React.createElement('div', { className: 'rounded-circle bg-info bg-opacity-10 p-3 me-3 text-info d-flex align-items-center justify-content-center flex-shrink-0', style: { width: '60px', height: '60px' } },
                        React.createElement('i', { className: 'fa-solid fa-calendar-days fa-lg' })
                    ),
                    React.createElement('div', {}, [
                        React.createElement('div', { className: 'small text-muted fw-bold opacity-75' }, 'PERIOD'),
                        React.createElement('h5', { className: 'mb-0 fw-bold small' }, stats.dateRange)
                    ])
                ])
            )
        ]),

        // Report Data Content
        reportData && React.createElement('div', { key: 'content-row', className: 'row g-4 animate-fade-in' }, [
            // Summary Column
            React.createElement('div', { key: 'summary-col', className: 'col-lg-4' },
                React.createElement('div', { className: 'modern-card h-100 d-flex flex-column' }, [
                    React.createElement('div', { className: 'card-header bg-transparent border-0 pt-4 px-4 pb-2' },
                        React.createElement('div', { className: 'd-flex align-items-center' }, [
                            React.createElement('div', { className: 'rounded-3 bg-primary bg-opacity-10 p-2 me-3 d-flex align-items-center justify-content-center', style: { width: '42px', height: '42px' } },
                                React.createElement('i', { className: 'fa-solid fa-chart-pie text-primary fs-5' })
                            ),
                            React.createElement('div', {}, [
                                React.createElement('h5', { className: 'fw-bold mb-0' }, 'Summary'),
                                React.createElement('small', { className: 'text-muted' }, 'Daily weight aggregation')
                            ])
                        ])
                    ),
                    React.createElement('div', { className: 'card-body p-0 flex-grow-1' },
                        React.createElement('div', { className: 'table-responsive' },
                            React.createElement('table', { className: 'table table-hover mb-0 align-middle table-modern' }, [
                                React.createElement('thead', { key: 'thead', className: 'bg-transparent' },
                                    React.createElement('tr', null, [
                                        React.createElement('th', { className: 'ps-4 text-uppercase text-muted small fw-bold border-bottom' }, 'Finish Date'),
                                        React.createElement('th', { className: 'text-end pe-4 text-uppercase text-muted small fw-bold border-bottom' }, 'Weight')
                                    ])
                                ),
                                React.createElement('tbody', { key: 'tbody' }, [
                                    ...reportData.summary.map((row, idx) => 
                                        React.createElement('tr', { 
                                            key: idx,
                                            style: { cursor: 'pointer' },
                                            onClick: () => scrollToDate(row.finishDate),
                                            title: 'Click to view details'
                                        }, [
                                            React.createElement('td', { className: 'ps-4 fw-medium' }, row.finishDate),
                                            React.createElement('td', { className: 'text-end pe-4 fw-bold text-primary' }, row.totalWeight.toFixed(2))
                                        ])
                                    ),
                                    reportData.summary.length === 0 && React.createElement('tr', { key: 'empty' },
                                        React.createElement('td', { colSpan: 2, className: 'text-center py-4 text-muted' }, 'No summary data found')
                                    )
                                ])
                            ])
                        )
                    )
                ])
            ),

            // Detail Column
            React.createElement('div', { key: 'detail-col', className: 'col-lg-8' },
                React.createElement('div', { className: 'modern-card h-100 d-flex flex-column' }, [
                    React.createElement('div', { className: 'card-header bg-transparent border-0 pt-4 px-4 pb-2' },
                        React.createElement('div', { className: 'd-flex align-items-center' }, [
                            React.createElement('div', { className: 'rounded-3 bg-info bg-opacity-10 p-2 me-3 d-flex align-items-center justify-content-center', style: { width: '42px', height: '42px' } },
                                React.createElement('i', { className: 'fa-solid fa-list-check text-info fs-5' })
                            ),
                            React.createElement('div', {}, [
                                React.createElement('h5', { className: 'fw-bold mb-0' }, 'Detailed Tasks'),
                                React.createElement('small', { className: 'text-muted' }, 'Comprehensive log of all activities')
                            ])
                        ])
                    ),
                    React.createElement('div', { className: 'card-body p-0 flex-grow-1' },
                        React.createElement('div', { 
                            id: 'detail-table-container',
                            className: 'table-responsive', 
                            style: { maxHeight: '650px' } 
                        },
                            React.createElement('table', { className: 'table table-hover mb-0 align-middle table-modern' }, [
                                React.createElement('thead', { key: 'thead', className: 'sticky-top', style: { zIndex: 10, backgroundColor: 'var(--bg-card)' } },
                                    React.createElement('tr', null, [
                                        React.createElement('th', { className: 'ps-4 text-uppercase text-muted small fw-bold border-bottom' }, 'Date'),
                                        React.createElement('th', { className: 'text-uppercase text-muted small fw-bold border-bottom' }, 'Task Description'),
                                        React.createElement('th', { className: 'text-uppercase text-muted small fw-bold border-bottom' }, 'Sheet'),
                                        React.createElement('th', { className: 'text-end pe-4 text-uppercase text-muted small fw-bold border-bottom' }, 'Weight')
                                    ])
                                ),
                                React.createElement('tbody', { key: 'tbody' }, [
                                    ...reportData.detail.map((row, idx) => {
                                        const isTotal = row.taskName === 'Total';
                                        // Generate ID for the first occurrence of each date to allow scrolling
                                        const isFirstOfDate = idx === 0 || reportData.detail[idx - 1].finishDate !== row.finishDate;
                                        const dateId = isFirstOfDate ? `detail-date-${row.finishDate.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}` : undefined;

                                        return React.createElement('tr', { 
                                            key: idx, 
                                            className: isTotal ? "table-active" : "",
                                            id: dateId 
                                        }, [
                                            React.createElement('td', { className: 'ps-4 text-nowrap small text-muted' }, row.finishDate),
                                            React.createElement('td', { className: isTotal ? "fw-bold text-uppercase" : "" }, 
                                                isTotal ? React.createElement('span', { className: 'badge bg-secondary px-3' }, 'Daily Total') : row.taskName
                                            ),
                                            React.createElement('td', {}, row.sheetName && !isTotal &&
                                                React.createElement('span', { className: 'badge bg-modern-subtle text-body border fw-normal' }, row.sheetName)
                                            ),
                                            React.createElement('td', { className: `text-end pe-4 ${isTotal ? 'fw-bold text-primary' : ''}` }, 
                                                row.weight.toFixed(2)
                                            )
                                        ]);
                                    }),
                                    reportData.detail.length === 0 && React.createElement('tr', { key: 'empty' },
                                        React.createElement('td', { colSpan: 4, className: 'text-center py-4 text-muted' }, 'No details available')
                                    )
                                ])
                            ])
                        )
                    )
                ])
            )
        ])
    ]);
}
