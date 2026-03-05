from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import openpyxl

# Initialize WebDriver
driver = webdriver.Chrome()

# Initialize new Excel workbook and sheet
workbook = openpyxl.Workbook()
sheet = workbook.active
sheet.title = "Bra Products"

sheet.append(["Product Title", "Product Page URL", "Image URL", "Price", "Sizes Available"])

collected_ids = set()
collected_titles = []
base_url = "https://www.victoriassecret.com"

try:
    driver.get("https://www.victoriassecret.com/sg/vs/bras")

    # Wait for the main product container to be loaded
    container_xpath = "//*[contains(@class, 'react-non-purchasable-product-card')]"
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, container_xpath)))

    SCROLL_PAUSE_TIME = 1.5
    last_position = 0
    reached_bottom = False

    while not reached_bottom:
        # Scroll down by 300 pixels at a time
        driver.execute_script("window.scrollBy(0, 300);")
        time.sleep(SCROLL_PAUSE_TIME)

        # Check scroll position to see if we've reached the bottom
        curr_position = driver.execute_script("return window.pageYOffset;")
        if curr_position == last_position:
            reached_bottom = True
        last_position = curr_position

        # Extract currently visible product tiles
        tiles = driver.find_elements(By.XPATH, container_xpath)
        print(f"Found {len(tiles)} product tiles in current view")

        # Loop through all the visible tiles
        for tile in tiles:
            try:
                # Try to get a unique identifier for the tile by extracting product link
                anchor = tile.find_element(By.XPATH, ".//a[@aria-label]")
                product_link = anchor.get_attribute("href")

                # If product_link is available but not yet recorded, then record this tile's title.
                if product_link:
                    if product_link not in collected_ids:
                        collected_ids.add(product_link)

                        # Obtaining the product title from the span containing 'prism-danger-zone'
                        title_element = tile.find_element(By.XPATH, ".//span[contains(@class, 'prism-danger-zone')]")
                        product_title = title_element.text.strip()

                        # Extract image link: take the first img that has a class containing 'carousel-index-0'
                        image_element = tile.find_element(By.XPATH, ".//img[contains(@class, 'carousel-index-0')]")
                        image_link = image_element.get_attribute("srcset").split()[0]  # take first URL if multiple exist
                        if image_link.startswith('/'):
                            image_link = base_url + image_link

                        # Extract the price
                        price_element = tile.find_element(By.XPATH,
                                                          ".//div[contains(@class, 'prism-price')]//span[contains(@class, 'prism-danger-zone')]")
                        price = price_element.text.strip() if price_element else "Price not available"

                        sheet.append([product_title, product_link, image_link, price])
                        print("Title:", product_title)
                        print("URL:", product_link)
                        print("Image:", image_link)
                        print("Price:", price)

                        collected_titles.append(product_title)
                else:
                    print("Invalid Tile Encountered")

            except Exception as e:
                print("Error extracting title from tile:", e)

    print("Total unique product tiles collected:", len(collected_ids))
    print("Total titles collected:", len(collected_titles))


finally:
    time.sleep(5) 
    workbook.save("bra_products_vs.xlsx")
    driver.quit()
    print("Data extraction completed and saved to bra_products_vs.xlsx.")
