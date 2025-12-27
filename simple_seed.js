const fs = require('fs');
const path = require('path');

const userDataPath = '/Users/csk/Library/Application Support/invoice-manager';

if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
}

function generateContacts(count) {
    const contacts = [];
    for (let i = 1; i <= count; i++) {
        contacts.push({
            id: Date.now() + i,
            name: `Customer ${i}`,
            phone: `98765432${i.toString().padStart(2, '0')}`,
            email: `customer${i}@example.com`,
            gstin: `27AAAAA000${i}Z${i}`,
            address1: `${i} Main St, Sector ${i % 10}`,
            address2: `City ${i % 5}, State ${i % 2}`
        });
    }
    return contacts;
}

function generateProducts(count) {
    const products = [];
    for (let i = 1; i <= count; i++) {
        products.push({
            id: Date.now() + 1000 + i,
            name: `Product ${i}`,
            description: `High quality product ${i} for various uses.`,
            totalUnits: Math.floor(Math.random() * 100) + 10,
            unitPrice: Math.floor(Math.random() * 5000) + 100
        });
    }
    return products;
}

function generateInvoices(count, contacts, products) {
    const invoices = [];
    const today = new Date();

    for (let i = 1; i <= count; i++) {
        const contact = contacts[Math.floor(Math.random() * contacts.length)];
        const invoiceProducts = [];
        const numItems = Math.floor(Math.random() * 3) + 1;

        let subtotal = 0;
        for (let j = 0; j < numItems; j++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 5) + 1;
            const amount = product.unitPrice * quantity;
            subtotal += amount;

            invoiceProducts.push({
                productId: product.id,
                productName: product.name,
                description: product.description,
                quantity: quantity,
                unitPrice: product.unitPrice,
                amount: amount
            });
        }

        const taxRate = 18;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        const date = new Date(today);
        date.setDate(today.getDate() - (count - i));

        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');

        invoices.push({
            id: Date.now() + 2000 + i,
            invoiceNumber: `INV-${dateStr}-${i.toString().padStart(2, '0')}`,
            date: date.toISOString(),
            dueDate: new Date(date.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            customerId: contact.id,
            customerName: contact.name,
            items: invoiceProducts,
            taxType: 'GST',
            taxRate: taxRate,
            subtotal: subtotal,
            taxAmount: taxAmount,
            total: total,
            notes: `Auto-generated mock invoice ${i}`,
            status: i % 5 === 0 ? 'draft' : 'finalized'
        });
    }
    return invoices;
}

const contacts = generateContacts(50);
const products = generateProducts(50);
const invoices = generateInvoices(50, contacts, products);

fs.writeFileSync(path.join(userDataPath, 'contacts.json'), JSON.stringify(contacts, null, 2));
fs.writeFileSync(path.join(userDataPath, 'products.json'), JSON.stringify(products, null, 2));
fs.writeFileSync(path.join(userDataPath, 'invoices.json'), JSON.stringify(invoices, null, 2));

console.log('Successfully seeded 50 entries for contacts, products, and invoices.');
