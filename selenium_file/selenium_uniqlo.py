from pathlib import Path
import os

from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import openpyxl
import mysql.connector

# load .env from backend root (parent of selenium_file)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

db = mysql.connector.connect(
    host=os.environ["DB_HOST"],
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    database=os.environ.get("DB_NAME", "perfect_fit_db"),
)
cursor = db.cursor()

# Initialize WebDriver
driver = webdriver.Chrome()

# Initialize a new Excel workbook and sheet
workbook = openpyxl.Workbook()
sheet = workbook.active
sheet.title = "Bra Products"

sheet.append(["Product Title", "Price", "Image URL", "Product Page URL", "Sizes Available"])

added_urls = set()

try:
    driver.get("https://www.uniqlo.com/sg/en/women/innerwear/wireless-bra?path=%2C%2C9795&sort=2")

    # Wait until the product details are loaded
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, "product-tile")))

    # Find all the product tiles on the page
    product_tiles = driver.find_elements(By.TAG_NAME, "a")

    # Iterate through each product tile and extract details
    for product_tile in product_tiles:
        try:
            # Check if the 'data-category' attribute is set to "ga-category"
            data_category = product_tile.get_attribute("data-category")

            if data_category == "ga-category":

                # Extract the href (product page link)
                product_link = product_tile.get_attribute("href")

                # Skip the product if the URL has already been added
                if product_link in added_urls:
                    continue  # Skip to the next product

                # Add the product URL to the set of added URLs
                added_urls.add(product_link)
                # Extract product title and description
                product_title = product_tile.find_element(By.CLASS_NAME, "product-tile-product-description").text

                # Extract the price
                price = product_tile.find_element(By.CLASS_NAME, "price-original-ER").text

                # Extract image URL
                image_element = product_tile.find_element(By.CLASS_NAME, "thumb-img")
                image_url = image_element.get_attribute("src")


                # Print the extracted details
                print("Product Title:", product_title)
                print("Price:", price)
                print("Image URL:", image_url)
                print("Product Page URL:", product_link)

                # Open the product page in a new tab
                driver.execute_script("window.open(arguments[0], '_blank');", product_link)

                # Switch to the new tab
                driver.switch_to.window(driver.window_handles[1])

                # Wait for the product page to load and extract sizes
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, "fr-chip-wrapper-er")))

                # Find all the size options
                size_elements = driver.find_elements(By.CLASS_NAME, "fr-chip-wrapper-er")

                sizes = []
                # Extract the sizes only if there's a fr-chip-text class within the same container
                for size_element in size_elements:
                    # Check if the size_element contains a child with the class fr-chip-text
                    if size_element.find_elements(By.CLASS_NAME, "fr-chip-text"):
                        size = size_element.get_attribute("data-test")
                        if size:
                            sizes.append(size)

                print("Sizes available:", sizes)
                print("-" * 50)

                sheet.append([product_title, price, image_url, product_link, ", ".join(sizes)])

                insert_query = """
                INSERT INTO Products (product_title, price, image_url, product_page_url, sizes_available)
                VALUES (%s, %s, %s, %s, %s)
                """
                values = (product_title, price, image_url, product_link, ", ".join(sizes))
                cursor.execute(insert_query, values)
                db.commit()

                driver.close()
                driver.switch_to.window(driver.window_handles[0])

        except Exception as e:
            print("Error extracting details for a product:", e)

finally:
    time.sleep(5)

    workbook.save("bra_products.xlsx")

    driver.quit()

    cursor.close()
    db.close()

    print("Data extraction completed and saved to bra_products.xlsx.")
