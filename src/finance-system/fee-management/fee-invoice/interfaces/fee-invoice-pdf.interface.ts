export interface FeeInvoicePdf {
    schoolName: string,
    schoolLogo: string,
    schoolAddress: string,
    schoolPhone: string,
    invoiceNumber: string,
    studentId: string,
    studentName: string,
    className: string,
    invoiceDate: string,
    dueDate: string,
    monthUpto: string,
    charges: {
        name: string,
        amount: string,
        discount: string,
        total: string,
    }[],
    grandTotal: string,
    amountInWords: string,
    currency: string
}