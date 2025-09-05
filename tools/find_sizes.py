#!/usr/bin/python3

"""
Tool for getting the sizes of a bunch of images
Must be run from root
"""

import glob
from PIL import Image


DIRECTORY = "../res/spines/*.jpg"


def images_metadata(pat):
	for file in glob.glob(pat):
		img = Image.open(file)
		# yield (img.width, img.height)
		yield f"{file}\t{img.width}\t{img.height}"


print("\n".join(images_metadata(DIRECTORY)))
