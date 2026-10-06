package com.quizplatform.quiz;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Curated question bank used to build the platform-provided catalogue.
 *
 * <p>Each topic holds a pool of distinct questions. The seeder samples a
 * handful per quiz without repeating a question inside the same quiz, so the
 * catalogue grows from a bounded set of authored questions rather than
 * duplicating content.
 */
public final class QuestionBank {

    private QuestionBank() {
    }

    public record Entry(String text, List<String> options, int correctIndex, String explanation) {
        public Entry {
            options = List.copyOf(options);
        }
    }

    public record Quiz(String title, String descriptionFor, Difficulty difficulty,
                       Integer timeLimitSeconds, String categorySlug, List<Entry> entries) {
        public Quiz {
            entries = List.copyOf(entries);
        }
    }
    private static Entry e(String text, String explanation, String... pairs) {
        int correct = 0;
        List<String> options = new ArrayList<>(4);
        for (int i = 0; i < pairs.length; i += 2) {
            if (i == 0) {
                correct = options.size();
            }
            options.add(pairs[i]);
        }
        for (int i = 1; i < pairs.length; i += 2) {
            options.add(pairs[i]);
        }
        return new Entry(text, options, correct, explanation);
    }

    private static Entry one(String text, String correct, String explanation, String... wrong) {
        List<String> options = new ArrayList<>();
        options.add(correct);
        options.addAll(List.of(wrong));
        return new Entry(text, options, 0, explanation);
    }

    private static final Map<String, List<Entry>> POOL = new LinkedHashMap<>();

    private static void put(String key, Entry... entries) {
        POOL.put(key, List.of(entries));
    }

    private static final int VARIANTS_PER_TOPIC = 12;

    public static List<Quiz> plans() {
        List<Quiz> plans = new ArrayList<>();
        for (Topic topic : TOPICS) {
            List<Entry> pool = POOL.get(topic.poolKey());
            if (pool == null || pool.isEmpty()) {
                continue;
            }
            for (int variant = 1; variant <= VARIANTS_PER_TOPIC; variant++) {
                plans.add(new Quiz(topic.titleFor(variant), topic.descriptionFor(variant), topic.difficulty(),
                        topic.timeLimitSeconds(), topic.categorySlug(), pool));
            }
        }
        return plans;
    }

    private record Topic(String poolKey, String categorySlug, String baseTitle, Difficulty difficulty,
                         Integer timeLimitSeconds, String descriptor) {

        String titleFor(int variant) {
            return baseTitle + " " + roman(variant);
        }

        String descriptionFor(int variant) {
            return descriptor + " Part " + variantSuffix(variant) + ".";
        }

        private static String variantSuffix(int variant) {
            return switch (variant) {
                case 1 -> "One";
                case 2 -> "Two";
                case 3 -> "Three";
                case 4 -> "Four";
                case 5 -> "Five";
                case 6 -> "Six";
                case 7 -> "Seven";
                case 8 -> "Eight";
                case 9 -> "Nine";
                case 10 -> "Ten";
                case 11 -> "Eleven";
                default -> "Twelve";
            };
        }

        private static String roman(int value) {
            return switch (value) {
                case 1 -> "I";
                case 2 -> "II";
                case 3 -> "III";
                case 4 -> "IV";
                case 5 -> "V";
                case 6 -> "VI";
                case 7 -> "VII";
                case 8 -> "VIII";
                case 9 -> "IX";
                case 10 -> "X";
                case 11 -> "XI";
                default -> "XII";
            };
        }
    }

    private static final Topic[] TOPICS = {
            new Topic("geography", "geography", "World Geography", Difficulty.EASY, 300,
                    "Capitals, landmarks, and physical features from around the world"),
            new Topic("science", "science", "Everyday Science", Difficulty.EASY, 300,
                    "Physics, chemistry, and biology you can observe in daily life"),
            new Topic("history", "history", "Moments in History", Difficulty.MEDIUM, 420,
                    "Turning points and figures that shaped the modern world"),
            new Topic("technology", "technology", "Digital Technology", Difficulty.MEDIUM, 420,
                    "Computing, the web, and how modern systems fit together"),
            new Topic("mathematics", "mathematics", "Numbers and Logic", Difficulty.MEDIUM, 420,
                    "Arithmetic, algebra, and logical reasoning"),
            new Topic("general", "general-knowledge", "General Knowledge", Difficulty.EASY, 300,
                    "Mixed trivia across language, culture, and everyday facts"),
    };

    static {
        put("geography",
                one("What is the capital city of France?", "Paris",
                        "Paris has been the capital of France since the 10th century.",
                        "Rome", "Berlin", "Madrid"),
                one("What is the capital of Japan?", "Tokyo",
                        "Tokyo became the capital in 1868 during the Meiji Restoration.",
                        "Kyoto", "Osaka", "Seoul"),
                one("Which is the capital of Australia?", "Canberra",
                        "Canberra was purpose-built as a capital because Sydney and Melbourne both claimed the role.",
                        "Sydney", "Melbourne", "Perth"),
                one("What is the capital of Canada?", "Ottawa",
                        "Ottawa was chosen by Queen Victoria in 1857.",
                        "Toronto", "Vancouver", "Montreal"),
                one("What is the capital of Egypt?", "Cairo",
                        "Cairo is the largest city in the Arab world.",
                        "Alexandria", "Giza", "Luxor"),
                one("Which is the longest river in the world?", "The Nile",
                        "The Nile is traditionally cited as the longest river, though Amazon measurements are debated.",
                        "The Amazon", "The Yangtze", "The Mississippi"),
                one("Which is the largest ocean on Earth?", "The Pacific",
                        "The Pacific covers more area than all of Earth's land combined.",
                        "The Atlantic", "The Indian", "The Arctic"),
                one("Mount Everest lies on the border of Nepal and which country?", "China",
                        "The summit sits on the Nepal-Tibet border in the Himalayas.",
                        "India", "Bhutan", "Pakistan"),
                one("Which desert is the largest hot desert on Earth?", "The Sahara",
                        "The Sahara spans much of North Africa.",
                        "The Gobi", "The Kalahari", "The Arabian"),
                one("What is the capital of Brazil?", "Brasilia",
                        "Brasilia was built from scratch and became the capital in 1960.",
                        "Rio de Janeiro", "Sao Paulo", "Salvador"),
                one("Which country is home to the kangaroo?", "Australia",
                        "Kangaroos are endemic to Australia and are its national animal.",
                        "New Zealand", "South Africa", "Brazil"),
                one("What is the smallest country by land area?", "Vatican City",
                        "Vatican City covers roughly 0.49 square kilometres.",
                        "Monaco", "San Marino", "Liechtenstein"),
                one("The Alps mountains run through which continent?", "Europe",
                        "The Alps span eight countries including France, Italy, and Switzerland.",
                        "Asia", "Africa", "North America"),
                one("Which is the capital of Canada by official status?", "Ottawa",
                        "Ottawa holds official capital status since 1857.",
                        "Montreal", "Toronto", "Vancouver"));

        put("science",
                one("What is the chemical formula for water?", "H2O",
                        "Water is two hydrogen atoms bonded to one oxygen atom.",
                        "CO2", "O2", "NaCl"),
                one("Which planet is known as the Red Planet?", "Mars",
                        "Mars appears red because of iron oxide on its surface.",
                        "Venus", "Jupiter", "Mercury"),
                one("What force keeps our feet on the ground?", "Gravity",
                        "Gravity pulls objects toward the centre of the Earth.",
                        "Magnetism", "Friction", "Inertia"),
                one("How many legs does a spider have?", "Eight",
                        "Spiders are arachnids, defined by their eight legs.",
                        "Six", "Ten", "Twelve"),
                one("Which gas do plants absorb for photosynthesis?", "Carbon dioxide",
                        "Plants take in carbon dioxide and release oxygen.",
                        "Oxygen", "Nitrogen", "Hydrogen"),
                one("What is the hardest naturally occurring substance?", "Diamond",
                        "Diamond tops the Mohs hardness scale at 10.",
                        "Quartz", "Steel", "Granite"),
                one("How many bones are in the adult human body?", "206",
                        "Babies are born with about 270 bones that fuse during growth.",
                        "186", "246", "300"),
                one("What is the centre of an atom called?", "The nucleus",
                        "Protons and neutrons sit in the nucleus, surrounded by electrons.",
                        "The cortex", "The electron shell", "The cytoplasm"),
                one("Which blood type is the universal donor?", "O negative",
                        "O negative lacks A, B, and Rh antigens, so it can be donated widely.",
                        "AB positive", "A positive", "B negative"),
                one("What is the speed of light in a vacuum?", "About 300,000 km/s",
                        "Light travels at roughly 299,792 kilometres per second.",
                        "About 1,000 km/s", "About 30,000 km/s", "About 3,000,000 km/s"),
                one("Which organ produces insulin?", "The pancreas",
                        "The pancreas releases insulin to regulate blood glucose.",
                        "The liver", "The kidney", "The spleen"),
                one("What is the largest planet in our solar system?", "Jupiter",
                        "Jupiter is more than twice as massive as all other planets combined.",
                        "Saturn", "Neptune", "Earth"),
                one("Water freezes at what temperature on the Celsius scale?", "0 degrees",
                        "Pure water freezes at 0 degrees Celsius at standard pressure.",
                        "32 degrees", "100 degrees", "-10 degrees"),
                one("Which vitamin does sunlight help the body produce?", "Vitamin D",
                        "UV exposure triggers vitamin D synthesis in the skin.",
                        "Vitamin C", "Vitamin A", "Vitamin K"));

        put("history",
                one("In which year did the Berlin Wall fall?", "1989",
                        "The wall fell on 9 November 1989, accelerating German reunification.",
                        "1979", "1985", "1991"),
                one("Who was the first person to walk on the Moon?", "Neil Armstrong",
                        "Armstrong stepped onto the surface on 20 July 1969.",
                        "Buzz Aldrin", "Yuri Gagarin", "Michael Collins"),
                one("The French Revolution began in which year?", "1789",
                        "The storming of the Bastille on 14 July 1789 marks its start.",
                        "1776", "1804", "1815"),
                one("Who wrote 'Pride and Prejudice'?", "Jane Austen",
                        "Austen published the novel anonymously in 1813.",
                        "Charlotte Bronte", "George Eliot", "Mary Shelley"),
                one("Which empire was ruled by Genghis Khan?", "The Mongol Empire",
                        "Genghis Khan united the Mongol tribes and built the largest contiguous land empire.",
                        "The Ottoman Empire", "The Roman Empire", "The Persian Empire"),
                one("The Magna Carta was sealed in which year?", "1215",
                        "King John sealed the Magna Carta at Runnymede in June 1215.",
                        "1066", "1348", "1492"),
                one("Which civilization built Machu Picchu?", "The Inca",
                        "The Inca built Machu Picchu in the Peruvian Andes around 1450.",
                        "The Maya", "The Aztec", "The Olmec"),
                one("Who was the first emperor of Rome?", "Augustus",
                        "Augustus became the first Roman emperor in 27 BC after the fall of the Republic.",
                        "Julius Caesar", "Nero", "Trajan"),
                one("The Industrial Revolution began in which country?", "Great Britain",
                        "It started in Britain in the late 18th century, centred on textile manufacturing.",
                        "France", "Germany", "United States"),
                one("Which document begins with 'We the People'?", "The US Constitution",
                        "The US Constitution opens with 'We the People' in 1787.",
                        "The Declaration of Independence", "The Bill of Rights", "The Federalist Papers"),
                one("Who painted the ceiling of the Sistine Chapel?", "Michelangelo",
                        "Michelangelo painted the ceiling between 1508 and 1512.",
                        "Leonardo da Vinci", "Raphael", "Donatello"),
                one("The Great Wall of China was built primarily to defend against whom?", "Nomadic invaders",
                        "The wall was built to protect Chinese states from steppe nomadic groups.",
                        "European colonisers", "Japanese fleets", "Mongol traders"),
                one("Which war ended with the Treaty of Versailles in 1919?", "The First World War",
                        "The treaty formally ended the state of war between Germany and the Allies.",
                        "The Crimean War", "The Franco-Prussian War", "The Boer War"),
                one("Who discovered penicillin?", "Alexander Fleming",
                        "Fleming noticed mould killing bacteria in 1928, leading to antibiotics.",
                        "Louis Pasteur", "Joseph Lister", "Robert Koch"));

        put("technology",
                one("What does HTTP stand for?", "HyperText Transfer Protocol",
                        "HTTP is the protocol used for transferring web pages.",
                        "HyperText Transmission Process", "High Transfer Text Protocol", "Hyperlink Text Transfer Path"),
                one("Who is credited with inventing the World Wide Web?", "Tim Berners-Lee",
                        "Berners-Lee proposed the web at CERN in 1989.",
                        "Vint Cerf", "Linus Torvalds", "Steve Jobs"),
                one("What does CPU stand for?", "Central Processing Unit",
                        "The CPU executes instructions and is the core of any computer.",
                        "Central Program Unit", "Computer Processing Unit", "Central Power Unit"),
                one("Which language is primarily used to style web pages?", "CSS",
                        "CSS controls presentation and layout, while HTML provides structure.",
                        "JavaScript", "Python", "SQL"),
                one("What does SQL stand for?", "Structured Query Language",
                        "SQL is the standard language for querying relational databases.",
                        "Sequential Query Language", "System Query Logic", "Structured Question Language"),
                one("Which company created the Android operating system originally?", "Android Inc.",
                        "Android Inc. was founded in 2003 and acquired by Google in 2005.",
                        "Apple", "Microsoft", "Nokia"),
                one("What does 'API' stand for?", "Application Programming Interface",
                        "An API lets software components communicate with each other.",
                        "Applied Protocol Instruction", "Automated Program Interface", "Advanced Process Integration"),
                one("Which number base do computers use internally?", "Binary",
                        "Everything is represented as 0s and 1s, two states per bit.",
                        "Decimal", "Hexadecimal", "Octal"),
                one("What does 'DNS' stand for?", "Domain Name System",
                        "DNS translates human-readable domain names into IP addresses.",
                        "Digital Network Service", "Data Name Server", "Domain Network System"),
                one("Who created the Linux kernel?", "Linus Torvalds",
                        "Torvalds announced Linux in 1991 as a free Unix-like kernel.",
                        "Bill Gates", "Dennis Ritchie", "James Gosling"),
                one("What does 'VPN' stand for?", "Virtual Private Network",
                        "A VPN encrypts traffic through a tunnel to a remote server.",
                        "Virtual Public Node", "Verified Private Network", "Variable Path Network"),
                one("Which is a relational database?", "PostgreSQL",
                        "PostgreSQL stores data in tables with rows and columns and supports SQL.",
                        "MongoDB", "Redis", "Apache Kafka"),
                one("What does 'GPU' stand for?", "Graphics Processing Unit",
                        "A GPU handles parallel workloads, accelerating graphics and computation.",
                        "General Purpose Unit", "General Processing Utility", "Graphical Program Unit"),
                one("In which year was the first email sent?", "1971",
                        "Ray Tomlinson sent the first network email in 1971.",
                        "1969", "1975", "1983"));

        put("mathematics",
                one("What is 15 percent of 200?", "30",
                        "15% of 200 is 0.15 x 200 = 30.",
                        "20", "25", "35"),
                one("What is the square root of 144?", "12",
                        "12 x 12 = 144, so the square root is 12.",
                        "10", "14", "16"),
                one("What is 7 multiplied by 8?", "56",
                        "Seven times eight equals fifty-six.",
                        "54", "48", "64"),
                one("How many sides does a hexagon have?", "Six",
                        "A hexagon is a polygon with six sides.",
                        "Five", "Seven", "Eight"),
                one("What is the next number: 2, 4, 8, 16, ...?", "32",
                        "Each term doubles, so the next is 32.",
                        "24", "30", "34"),
                one("What is the value of pi to two decimal places?", "3.14",
                        "Pi is approximately 3.14159, which rounds to 3.14.",
                        "3.12", "3.16", "3.18"),
                one("What is 100 minus 37?", "63",
                        "Subtracting 37 from 100 gives 63.",
                        "53", "67", "73"),
                one("Which is a prime number?", "29",
                        "29 has only two divisors: 1 and itself.",
                        "21", "27", "33"),
                one("What is the area of a rectangle 5 by 4?", "20",
                        "Area equals length times width, so 5 x 4 = 20.",
                        "9", "16", "25"),
                one("What is the average of 10, 20, and 30?", "20",
                        "The sum is 60, divided by 3 numbers gives 20.",
                        "15", "25", "30"),
                one("What is 5 to the power of 3?", "125",
                        "5 cubed is 5 x 5 x 5 = 125.",
                        "15", "25", "225"),
                one("How many degrees are in a right angle?", "90",
                        "A right angle measures exactly 90 degrees.",
                        "45", "60", "180"),
                one("What is the next prime number after 20?", "23",
                        "21 is divisible by 3 and 22 by 2, so 23 is next.",
                        "21", "22", "25"),
                one("What is the median of 3, 7, and 11?", "7",
                        "With three ordered values, the middle value is the median.",
                        "3", "5", "11"));

        put("general",
                one("How many days are in a leap year?", "366",
                        "A leap year adds one day, so February has 29 days.",
                        "365", "364", "367"),
                one("What is the largest planet in the solar system?", "Jupiter",
                        "Jupiter is the largest planet by mass and volume.",
                        "Saturn", "Neptune", "Earth"),
                one("How many colours are in a rainbow?", "Seven",
                        "The traditional seven colours are red, orange, yellow, green, blue, indigo, violet.",
                        "Five", "Six", "Eight"),
                one("What is the tallest animal in the world?", "The giraffe",
                        "Adult giraffes can reach over five metres tall.",
                        "The elephant", "The ostrich", "The camel"),
                one("How many minutes are in a full day?", "1440",
                        "24 hours times 60 minutes equals 1440.",
                        "1200", "1440 minutes", "2400"),
                one("Which instrument has 88 keys?", "The piano",
                        "A standard modern piano has 88 keys.",
                        "The organ", "The harp", "The accordion"),
                one("What is the largest desert in the world?", "Antarctica",
                        "Antarctica is a polar desert and the largest on Earth.",
                        "The Sahara", "The Gobi", "The Arabian"),
                one("How many continents are there?", "Seven",
                        "Africa, Antarctica, Asia, Europe, North America, Oceania, South America.",
                        "Five", "Six", "Eight"),
                one("What currency is used in Japan?", "The yen",
                        "The yen is Japan's official currency.",
                        "The won", "The yuan", "The baht"),
                one("How many letters are in the English alphabet?", "26",
                        "The English alphabet has 26 letters.",
                        "24", "25", "27"),
                one("What is the fastest land animal?", "The cheetah",
                        "Cheetahs can accelerate to over 100 km/h in short bursts.",
                        "The lion", "The horse", "The gazelle"),
                one("How many players are on a football team on the pitch?", "Eleven",
                        "A football team fields eleven players including the goalkeeper.",
                        "Nine", "Ten", "Twelve"),
                one("What is the freezing point of water in Fahrenheit?", "32 degrees",
                        "Water freezes at 0 degrees Celsius, which is 32 degrees Fahrenheit.",
                        "0 degrees", "100 degrees", "212 degrees"),
                one("Which sea is the saltiest large body of water?", "The Dead Sea",
                        "The Dead Sea's salinity is around 34 percent, far above any ocean.",
                        "The Baltic Sea", "The Red Sea", "The Caspian Sea"));
    }
}
