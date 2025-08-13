include $(TOPDIR)/rules.mk

PKG_NAME:=bmcwebUI
PKG_VERSION:=1.0
PKG_RELEASE:=1

PKG_BUILD_DIR := $(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/bmcwebUI
  SECTION:=webUI
  CATEGORY:=BMC
  TITLE:=BMC Web UI (Node.js Scripts)
  DEPENDS:=+node +libpthread
endef

define Package/bmcwebUI/description
  Custom BMC Web UI with Node.js scripts installed to /etc/bmcweb.
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
endef

define Build/Compile
	echo "Compiling BMC Web UI scripts..."
	npx esbuild ./files/backend/server.js --bundle --platform=node --outfile=./files/backend/server.bundle.js
	echo "BMC Web UI scripts compiled successfully."

endef

define Build/InstallDev
	# Skip dev install
endef

define Package/bmcwebUI/install
	$(INSTALL_DIR) $(1)/etc/bmcweb
	( \
		cd ./files && \
		find . -path './backend/node_modules' -prune -o -print | \
		cpio -pdm $(1)/etc/bmcweb \
	)
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/bmcwebUI.init $(1)/etc/init.d/bmcwebUI
	find $(1)/etc/bmcweb/backend/scripts -type f -name "*.sh" -exec chmod +x {} \;
endef

$(eval $(call BuildPackage,bmcwebUI))
