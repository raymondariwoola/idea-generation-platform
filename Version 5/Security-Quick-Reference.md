# Security Quick Reference Card

## 🛡️ What's Protected

Your Innovation Portal has **3 layers of security**:

### 1. PCI DSS Protection
Automatically detects and blocks:
- Credit card numbers
- Account numbers
- Emirates ID
- Passport numbers
- SSN/National ID
- CVV/CVC codes
- IBAN numbers
- PIN codes

### 2. XSS Protection
Prevents malicious code:
- Script injections
- Event handler attacks
- Iframe injections
- JavaScript protocols

### 3. Visual Security
- Security notice banner on forms
- Real-time warning messages
- Protection status badges

## ✅ What to Do

**For Users:**
- Submit ideas freely - the system protects you
- Use examples instead of real numbers
- Watch for warning messages

**Example - Safe:**
```
"We should improve the credit card payment process 
to reduce transaction time from 5 seconds to 2 seconds."
```

**Example - Unsafe (Auto-Redacted):**
```
"My card 4532-1234-5678-9010 was declined."
→ Becomes: "My card XXXXXXXX (Not PCI DSS Compliant) was declined."
```

## 🚫 What NOT to Do

❌ Don't enter real credit card numbers  
❌ Don't include actual account numbers  
❌ Don't paste Emirates ID or passport numbers  
❌ Don't include CVV codes  
❌ Don't use real SSN/National IDs  

## 📝 How It Works

1. **Type normally** - System monitors in real-time
2. **Automatic redaction** - Sensitive data replaced instantly
3. **Visual warning** - Yellow/red message appears
4. **Final check** - Data sanitized before submission
5. **Safe storage** - Only clean data reaches SharePoint

## 🎯 Example Workflow

```
You type: "My account 12345678901234 has an issue"
           ↓
System detects account number
           ↓
Text becomes: "My account XXXXXXXX (Not PCI DSS Compliant) has an issue"
           ↓
Warning message shows: "⚠️ Sensitive data detected and redacted"
           ↓
Safe to submit! ✅
```

## 🔍 Test It Yourself

Try typing these patterns in any text field:

| Pattern | What Happens |
|---------|--------------|
| `4532 1234 5678 9010` | Redacted (credit card) |
| `784-1990-1234567-1` | Redacted (Emirates ID) |
| `CVV: 123` | Redacted (CVV code) |
| `<script>alert</script>` | Removed (XSS) |

## 💡 Tips

1. **Use general descriptions** instead of specific numbers
2. **Focus on the problem/solution**, not sensitive examples
3. **Trust the system** - it catches patterns you might miss
4. **Check warnings** - they tell you what was detected

## 🎨 Visual Indicators

**Blue Banner** at top of form = Security active  
**Yellow Warning** under field = PCI data detected  
**Red Warning** under field = XSS attempt blocked  
**Green Badges** = Protection layers active  

## 📞 Questions?

Check the full guide: `Security-Implementation-Guide.md`

---

**Remember**: If you see a warning, it means the system is working! 🎉
