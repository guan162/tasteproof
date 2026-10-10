import unittest
from app import compare

class TestTasteProof(unittest.TestCase):
    def test_comparison(self):
        r=compare("Tokyo","Taipei")
        self.assertIn("craft coffee",r["shared"])
        self.assertIn("fictional",r["source"])
        self.assertGreater(r["difference_index"],0)
    def test_reject_identical(self):
        with self.assertRaises(ValueError):
            compare("Tokyo","Tokyo")

if __name__=="__main__":
    unittest.main()
