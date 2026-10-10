# Thaliyo pilot kit

Everything the Thaliyo team needs to sell, set up and train the first pilot restaurants. Each file
is an A4 page set: open it in Chrome and press **Ctrl+P** to print, or choose **Save as PDF**.

| File | For | What's in it |
|---|---|---|
| [brochure.html](brochure.html) | Restaurant owners | 2 pages: what Thaliyo does, why switch, plans and founding prices, how to start |
| [sales-playbook.html](sales-playbook.html) | Thaliyo team | Demo café account, what to carry, the 10-minute demo script, answers to common questions, WhatsApp messages (intro, welcome owner, welcome staff, trial ending) |
| [setup-checklist.html](setup-checklist.html) | Thaliyo team on site | Before the visit, Business panel setup, devices, test run, training plan, go-live, 14-day trial follow-up, problem log |
| [training-sheets.html](training-sheets.html) | Restaurant staff | One page each: waiter, kitchen, cashier, owner/manager |

Button names in the sheets are the app's own English labels. Staff can switch the app to
Hindi or Marathi (Menu → Language); the sheets themselves are English until a native speaker
has checked a translation.

## Fill in before printing

The dashed blanks are left for details that don't exist yet:

- the support **WhatsApp / phone** and **email** (brochure, last page)
- the **website** address (brochure), and the **Staff app** and **Business panel** addresses (training sheets)
- the restaurant's name on the training sheets and the setup checklist (write it by hand)

## Keep in step with the app

- Prices and plans come from `apps/marketing-site/site.json`. Change both together.
- Features marked *coming soon* in the brochure and playbook (riders app, inventory, owner
  analytics) must keep that label until they ship.
- The WhatsApp messages also live in Super Admin (`apps/super-admin/src/app/core/whatsapp-templates.ts`),
  where each lead's page fills in the owner, restaurant, date and plan.
