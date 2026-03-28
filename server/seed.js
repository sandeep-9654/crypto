require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const Round = require('./models/Round');
const Question = require('./models/Question');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create default admin
        const existingAdmin = await Admin.findOne({ username: 'admin' });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin@crypto2025', 12);
            await Admin.create({
                username: 'admin',
                passwordHash: hashedPassword
            });
            console.log('✓ Admin created: admin / admin@crypto2025');
        } else {
            console.log('⚡ Admin already exists');
        }

        // 2. Create rounds
        const round1 = await Round.findOneAndUpdate(
            { roundNumber: 1 },
            { roundNumber: 1, roundName: 'LEVEL 01 — INITIATION', isActive: true, timeLimitSeconds: 3600 },
            { upsert: true, new: true }
        );
        console.log('✓ Round 1 created/updated');

        const round2 = await Round.findOneAndUpdate(
            { roundNumber: 2 },
            { roundNumber: 2, roundName: 'LEVEL 02 — OMEGA PROTOCOL', isActive: false, timeLimitSeconds: 3600 },
            { upsert: true, new: true }
        );
        console.log('✓ Round 2 created/updated');

        // 3. Round 1 Questions (10 questions — answer-chained)
        // CHAIN: START → FIVE → BLOCK → CHAIN → LINK → CODE → 7 → VAULT → GATE → OMEGA
        const round1Questions = [
            {
                roundId: round1._id, roundNumber: 1, questionNumber: 1, displayOrder: 1,
                cipherType: 'CCS',
                cipherLabel: 'Caesar Cipher (Shift 13) - A substitution cipher where each letter is shifted by a fixed number of positions down the alphabet. Method: Shift each letter back by 13 positions.',
                encryptedText: 'FGNEG',
                correctAnswer: 'START',
                hintLetter: 'S',
                hint: 'This word means "to begin". It is the ROT-13 cipher (shift 13).',
                points: 10
            },
            {
                roundId: round1._id, roundNumber: 1, questionNumber: 2, displayOrder: 2,
                cipherType: 'MORSE',
                cipherLabel: 'Morse Code - A method of encoding text characters as standardized sequences of dots and dashes. Method: Translate the dot-dash sequence into letters.',
                encryptedText: '..-. .. ...- .',
                correctAnswer: 'FIVE',
                hintLetter: 'F',
                hint: 'You have made a START. Decode this Morse transmission. The answer is a number word — it will tell you the shift for the next cipher.',
                points: 10
            },
            {
                roundId: round1._id, roundNumber: 1, questionNumber: 3, displayOrder: 3,
                cipherType: 'CCS',
                cipherLabel: 'Caesar Cipher (Shift 5) - A substitution cipher where each letter is shifted by a fixed number of positions down the alphabet. Method: Shift each letter back by 5 positions.',
                encryptedText: 'GQTHP',
                correctAnswer: 'BLOCK',
                hintLetter: 'B',
                hint: 'FIVE is your key. Shift = 5. Decode this Caesar cipher (shift back 5 places).',
                points: 10
            },
            {
                roundId: round1._id, roundNumber: 1, questionNumber: 4, displayOrder: 4,
                cipherType: 'VIG',
                cipherLabel: 'Vigenère Cipher - A polyalphabetic substitution cipher that uses a keyword to shift each letter by a different amount. Method: Use your previous answer (BLOCK) as the key. For each letter, shift backward by the corresponding key letter\'s position (A=0, B=1 ... Z=25).',
                encryptedText: 'DSOKX',
                correctAnswer: 'CHAIN',
                hintLetter: 'C',
                hint: 'Each BLOCK in the grid hides a shift. Use BLOCK as the Vigenère key to decode.',
                points: 15
            },
            {
                roundId: round1._id, roundNumber: 1, questionNumber: 5, displayOrder: 5,
                cipherType: 'PCS',
                cipherLabel: 'Polybius Caesar Cipher (Shift 6) - A fractionating substitution cipher. Method: Apply Caesar shift 6 to the alphabet first, then use a 5x5 grid to map number pairs to letters.',
                encryptedText: '21 13 23 15',
                correctAnswer: 'LINK',
                hintLetter: 'L',
                hint: 'Every CHAIN has a ___. Decode using Polybius Caesar 6. Each pair of digits = one letter (row then column).',
                points: 15
            },
            {
                roundId: round1._id, roundNumber: 1, questionNumber: 6, displayOrder: 6,
                cipherType: 'AC',
                cipherLabel: 'Affine Cipher - A type of monoalphabetic substitution cipher. Method: E(x) = (ax + b) mod m, where a=7, b=5, m=26. Reverse the operation to decode.',
                encryptedText: 'TZAH',
                correctAnswer: 'CODE',
                hintLetter: 'C',
                hint: 'A strong LINK connects to the answer. Decrypt using Affine Cipher: multiply by 7, add 5, mod 26. Reverse the operation to decode.',
                points: 15
            },
            {
                roundId: round1._id, roundNumber: 1, questionNumber: 7, displayOrder: 7,
                cipherType: 'CODE',
                cipherLabel: 'C Programming snippet - Analyze the C code execution to find the output. Method: Trace the variables and printf statements.',
                codeSnippet: '#include <stdio.h>\nint main() {\n    int a = 4;\n    int b = 3;\n    printf("%d", a + b);\n    return 0;\n}',
                correctAnswer: '7',
                hintLetter: '7',
                hint: 'To crack the CODE, find the output of this C program. The number you get is the shift for the next cipher.',
                points: 10
            },
            {
                roundId: round1._id, roundNumber: 1, questionNumber: 8, displayOrder: 8,
                cipherType: 'CCS',
                cipherLabel: 'Caesar Cipher (Shift 7) - A substitution cipher where each letter is shifted by a fixed number of positions down the alphabet. Method: Shift each letter back by 7 positions.',
                encryptedText: 'CHBSA',
                correctAnswer: 'VAULT',
                hintLetter: 'V',
                hint: 'Your previous answer is 7 — that is the Caesar shift. Decode (shift back 7 places).',
                points: 10
            },
            {
                roundId: round1._id, roundNumber: 1, questionNumber: 9, displayOrder: 9,
                cipherType: 'RFC',
                cipherLabel: 'Rail Fence Cipher - A transposition cipher that writes text in a zigzag pattern across a set number of rails, then reads off each rail in order. Method: Use 3 rails. Write GAET in zigzag, then reconstruct the original word.',
                encryptedText: 'GAET',
                correctAnswer: 'GATE',
                hintLetter: 'G',
                hint: 'Inside the VAULT is a hidden word. Arrange the letters across 3 rails in a zigzag to decode.',
                points: 20
            },
            {
                roundId: round1._id, roundNumber: 1, questionNumber: 10, displayOrder: 10,
                cipherType: 'MORSE',
                cipherLabel: 'Morse Code - A method of encoding text characters as standardized sequences of dots and dashes. Method: Translate the dot-dash sequence into letters.',
                encryptedText: '--- -- . --. .-',
                correctAnswer: 'OMEGA',
                hintLetter: 'O',
                hint: 'You have passed through the GATE. Decode this final transmission. Your answer is the KEY that unlocks Round 2.',
                points: 20
            }
        ];

        await Question.deleteMany({ roundNumber: 1 });
        await Question.insertMany(round1Questions);
        console.log(`✓ ${round1Questions.length} questions created for Round 1`);

        // 4. Round 2 Questions (5 questions — OMEGA-keyed)
        // Key: O(15)+M(13)+E(5)+G(7)+A(1) = 41 → 41 mod 26 = 15 (CCS15 shift)
        // CHAIN: CYBER → SHIELD → ALPHA → 13 → VICTORY
        const round2Questions = [
            {
                roundId: round2._id, roundNumber: 2, questionNumber: 1, displayOrder: 1,
                cipherType: 'CCS',
                cipherLabel: 'Caesar Cipher (Shift 15) - A substitution cipher where each letter is shifted by a fixed number of positions down the alphabet. Method: Shift each letter back by 15 positions.',
                encryptedText: 'RNQTG',
                correctAnswer: 'CYBER',
                hintLetter: 'C',
                hint: 'Your Round 1 key is OMEGA. Calculate its shift: O(15)+M(13)+E(5)+G(7)+A(1) = 41. Then 41 mod 26 = 15. Use 15 as your Caesar shift to decode.',
                points: 15
            },
            {
                roundId: round2._id, roundNumber: 2, questionNumber: 2, displayOrder: 2,
                cipherType: 'PLF',
                cipherLabel: 'Playfair Cipher - A digraph substitution cipher that encrypts pairs of letters using a 5x5 key matrix. Method: Build the matrix using CYBER as the key (fill remaining letters A-Z, I/J share one cell). Then decode each letter pair: same row → shift left; same column → shift up; rectangle → swap columns.',
                encryptedText: 'TGMCKF',
                correctAnswer: 'SHIELD',
                hintLetter: 'S',
                hint: 'In CYBER security, every system needs one of these. Use CYBER as the Playfair key. Decode each pair of letters.',
                points: 15
            },
            {
                roundId: round2._id, roundNumber: 2, questionNumber: 3, displayOrder: 3,
                cipherType: 'PCS',
                cipherLabel: 'Polybius Caesar Cipher (Shift 9) - A fractionating substitution cipher. Method: Apply Caesar shift 9 to the alphabet first, then use a 5x5 grid to map number pairs to letters. The grid starts with J.',
                encryptedText: '43 13 22 55 43',
                correctAnswer: 'ALPHA',
                hintLetter: 'A',
                hint: 'A SHIELD protects the data. Decode using Polybius Caesar 9. Each pair of digits = one letter (row then column). Shift 9 means the grid starts with J.',
                points: 20
            },
            {
                roundId: round2._id, roundNumber: 2, questionNumber: 4, displayOrder: 4,
                cipherType: 'CODE',
                cipherLabel: 'C Programming snippet - Analyze the C code execution to find the output. Method: Trace the recursive function to find the final printed value.',
                codeSnippet: '#include <stdio.h>\n\nint fibonacci(int n) {\n    if (n <= 1)\n        return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nint main() {\n    printf("%d", fibonacci(7));\n    return 0;\n}',
                correctAnswer: '13',
                hintLetter: '1',
                hint: 'This is the ALPHA sequence. The Fibonacci series: 0, 1, 1, 2, 3, 5, 8 ...',
                points: 20
            },
            {
                roundId: round2._id, roundNumber: 2, questionNumber: 5, displayOrder: 5,
                cipherType: 'MORSE',
                cipherLabel: 'Morse Code - A method of encoding text characters as standardized sequences of dots and dashes. Method: Translate the dot-dash sequence into letters.',
                encryptedText: '...- .. -.-. - --- .-. -.--',
                correctAnswer: 'VICTORY',
                hintLetter: 'V',
                hint: 'The 13th step is the last. Decode this final Morse transmission to complete your mission.',
                points: 25
            }
        ];

        await Question.deleteMany({ roundNumber: 2 });
        await Question.insertMany(round2Questions);
        console.log(`✓ ${round2Questions.length} questions created for Round 2`);

        console.log('\n✓ Seed completed successfully!');
        console.log('  Admin login: admin / admin@crypto2025');
        console.log('  Rounds: 2 (Round 1 active, Round 2 locked)');
        console.log(`  Questions: ${round1Questions.length + round2Questions.length} total`);
        console.log('\n  ROUND 1 CHAIN: START → FIVE → BLOCK → CHAIN → LINK → CODE → 7 → VAULT → GATE → OMEGA');
        console.log('  ROUND 2 CHAIN: CYBER → SHIELD → ALPHA → 13 → VICTORY');

        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();
